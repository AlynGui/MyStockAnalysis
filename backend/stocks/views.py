from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.views import APIView
from django.db.models import Q
from django.shortcuts import get_object_or_404
from .models import Stock, StockPrice, UserFavoriteStock, StockDataImportLog
from .serializers import (
    StockSerializer, StockPriceSerializer, UserFavoriteStockSerializer,
    StockDataImportLogSerializer
)
from .utils import import_stock_data, parse_excel_data


class StockListView(generics.ListAPIView):
    """
    Stock List View
    """
    serializer_class = StockSerializer
    permission_classes = []  # Allow anonymous access to stock list
    
    def get_queryset(self):
        """
        Get stock list with pagination and search support
        """
        queryset = Stock.objects.all()
        search = self.request.query_params.get('search', None)
        
        if search:
            queryset = queryset.filter(
                Q(symbol__icontains=search) | 
                Q(name__icontains=search) |
                Q(sector__icontains=search)
            )
        
        return queryset


class StockSearchView(generics.ListAPIView):
    """
    Stock Search View
    """
    serializer_class = StockSerializer
    permission_classes = []  # Allow anonymous access to stock search
    
    def get_queryset(self):
        """
        Search stocks by keywords
        """
        query = self.request.query_params.get('q', '')
        if query:
            return Stock.objects.filter(
                Q(symbol__icontains=query) | 
                Q(name__icontains=query)
            )[:10]  # Limit to 10 results
        return Stock.objects.none()


class StockDetailView(generics.RetrieveAPIView):
    """
    Stock Detail View
    """
    serializer_class = StockSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'symbol'
    queryset = Stock.objects.all()


class StockPriceListView(generics.ListAPIView):
    """
    Stock Price History Data View
    """
    serializer_class = StockPriceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Get price data for specific stock
        """
        symbol = self.kwargs['symbol']
        stock = get_object_or_404(Stock, symbol=symbol)
        
        # Get query parameters
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        queryset = StockPrice.objects.filter(stock=stock)
        
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        
        return queryset.order_by('-date')


class TechnicalIndicatorsView(APIView):
    """
    Technical Indicators View
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, symbol):
        """
        Get technical indicator data for stock
        """
        stock = get_object_or_404(Stock, symbol=symbol)
        
        # Get recent price data
        prices = StockPrice.objects.filter(stock=stock).order_by('-date')[:100]
        
        data = []
        for price in prices:
            data.append({
                'date': price.date,
                'close_price': price.close_price,
                'ma_5': price.ma_5,
                'ma_10': price.ma_10,
                'ma_20': price.ma_20,
                'ma_50': price.ma_50,
                'ema_12': price.ema_12,
                'ema_26': price.ema_26,
                'macd': price.macd,
                'macd_signal': price.macd_signal,
                'macd_histogram': price.macd_histogram,
                'rsi': price.rsi,
            })
        
        return Response(data)


class AddFavoriteStockView(APIView):
    """
    Add Favorite Stock View
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """
        Add stock to favorite list
        """
        symbol = request.data.get('symbol')
        if not symbol:
            return Response({'error': 'Stock symbol cannot be empty'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            stock = Stock.objects.get(symbol=symbol)
            favorite, created = UserFavoriteStock.objects.get_or_create(
                user=request.user,
                stock=stock
            )
            
            if created:
                return Response({'message': 'Added to favorites successfully'}, status=status.HTTP_201_CREATED)
            else:
                return Response({'message': 'Already in favorites'}, status=status.HTTP_200_OK)
                
        except Stock.DoesNotExist:
            return Response({'error': 'Stock does not exist'}, status=status.HTTP_404_NOT_FOUND)


class RemoveFavoriteStockView(APIView):
    """
    Remove Favorite Stock View
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """
        Remove stock from favorite list
        """
        symbol = request.data.get('symbol')
        if not symbol:
            return Response({'error': 'Stock symbol cannot be empty'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            stock = Stock.objects.get(symbol=symbol)
            favorite = UserFavoriteStock.objects.get(user=request.user, stock=stock)
            favorite.delete()
            return Response({'message': 'Removed from favorites successfully'}, status=status.HTTP_200_OK)
            
        except (Stock.DoesNotExist, UserFavoriteStock.DoesNotExist):
            return Response({'error': 'Favorite record does not exist'}, status=status.HTTP_404_NOT_FOUND)


class FavoriteStockListView(generics.ListAPIView):
    """
    User Favorite Stock List View
    """
    serializer_class = UserFavoriteStockSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None  # Disable pagination for favorites
    
    def get_queryset(self):
        """
        Get current user's favorite stock list
        """
        return UserFavoriteStock.objects.filter(user=self.request.user).select_related('stock')


class ExcelImportView(APIView):
    """
    Excel Data Import View
    """
    permission_classes = [IsAdminUser]
    
    def post(self, request):
        """
        Import stock data from Excel file
        """
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'File is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not file_obj.name.endswith(('.xlsx', '.xls')):
            return Response({'error': 'Only Excel files are supported'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Create import log
            import_log = StockDataImportLog.objects.create(
                import_type='excel',
                status='processing',
                file_path=file_obj.name,
                created_by=request.user
            )
            
            # Save file temporarily
            import tempfile
            import os
            
            with tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx') as tmp_file:
                for chunk in file_obj.chunks():
                    tmp_file.write(chunk)
                tmp_file_path = tmp_file.name
            
            try:
                # Parse Excel data
                data_list = parse_excel_data(tmp_file_path)
                
                success_count = 0
                error_count = 0
                
                for data in data_list:
                    try:
                        # Create or update stock
                        stock, created = Stock.objects.update_or_create(
                            symbol=data['symbol'],
                            defaults={
                                'name': data.get('name', ''),
                                'exchange': data.get('exchange', ''),
                                'sector': data.get('sector', ''),
                                'industry': data.get('industry', ''),
                                'market_cap': data.get('market_cap'),
                                'description': data.get('description', ''),
                                'pe_ratio': data.get('pe_ratio'),
                                'pb_ratio': data.get('pb_ratio'),
                                'dividend_yield': data.get('dividend_yield'),
                            }
                        )
                        success_count += 1
                    except Exception as e:
                        error_count += 1
                        continue
                
                # Update import log
                import_log.status = 'success'
                import_log.total_records = len(data_list)
                import_log.success_records = success_count
                import_log.failed_records = error_count
                import_log.save()
                
                return Response({
                    'message': 'Import completed successfully',
                    'total_records': len(data_list),
                    'success_records': success_count,
                    'failed_records': error_count
                }, status=status.HTTP_200_OK)
                
            finally:
                # Clean up temporary file
                os.unlink(tmp_file_path)
                
        except Exception as e:
            # Update import log
            import_log.status = 'failed'
            import_log.error_message = str(e)
            import_log.save()
            
            return Response({'error': f'Import failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ImportAPIDataView(APIView):
    """
    API Data Import View
    """
    permission_classes = [IsAdminUser]
    
    def post(self, request):
        """
        Import stock data from external API
        """
        symbol = request.data.get('symbol')
        period = request.data.get('period', '1y')
        
        if not symbol:
            return Response({'error': 'Stock symbol is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Create import log
            import_log = StockDataImportLog.objects.create(
                import_type='api',
                status='processing',
                created_by=request.user
            )
            
            # Import data
            success = import_stock_data(symbol)
            
            if success:
                import_log.status = 'success'
                import_log.total_records = 1
                import_log.success_records = 1
                import_log.failed_records = 0
                import_log.save()
                
                return Response({
                    'message': f'Successfully imported data for {symbol}',
                    'symbol': symbol
                }, status=status.HTTP_200_OK)
            else:
                import_log.status = 'failed'
                import_log.error_message = f'Failed to import data for {symbol}'
                import_log.save()
                
                return Response({'error': f'Failed to import data for {symbol}'}, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            import_log.status = 'failed'
            import_log.error_message = str(e)
            import_log.save()
            
            return Response({'error': f'Import failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ImportLogListView(generics.ListAPIView):
    """
    Data Import Log List View
    """
    serializer_class = StockDataImportLogSerializer
    permission_classes = [IsAdminUser]
    queryset = StockDataImportLog.objects.all()



