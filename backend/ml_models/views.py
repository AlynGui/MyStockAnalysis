from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.shortcuts import get_object_or_404
from .models import MLModel, StockPrediction, ModelTrainingLog, PredictionAccuracy
from stocks.models import Stock
from .serializers import (
    MLModelSerializer, StockPredictionSerializer, ModelTrainingLogSerializer,
    PredictionAccuracySerializer, TrainModelSerializer, PredictStockSerializer
)


class MLModelListView(generics.ListAPIView):
    """
    Machine Learning Model List View
    """
    serializer_class = MLModelSerializer
    permission_classes = [IsAuthenticated]
    queryset = MLModel.objects.all()


class MLModelCreateView(generics.CreateAPIView):
    """
    Create Machine Learning Model View
    """
    serializer_class = MLModelSerializer
    permission_classes = [IsAdminUser]
    
    def perform_create(self, serializer):
        """
        Set creator when creating model
        """
        serializer.save(created_by=self.request.user)


class MLModelDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Machine Learning Model Detail View
    """
    serializer_class = MLModelSerializer
    permission_classes = [IsAuthenticated]
    queryset = MLModel.objects.all()


class TrainModelView(APIView):
    """
    Train Model View
    """
    permission_classes = [IsAdminUser]
    
    def post(self, request):
        """
        Start model training
        """
        serializer = TrainModelSerializer(data=request.data)
        if serializer.is_valid():
            model_id = serializer.validated_data['model_id']
            stock_symbol = serializer.validated_data.get('stock_symbol')
            
            try:
                model = MLModel.objects.get(id=model_id)
                
                # Create training log
                training_log = ModelTrainingLog.objects.create(
                    model=model,
                    status='started',
                    started_by=request.user,
                    total_epochs=model.epochs
                )
                
                # Here should start async training task
                # In actual project, Celery or other async task queue would be used
                # This is just an example
                
                return Response({
                    'message': 'Model training has started',
                    'training_log_id': training_log.id,
                    'model_name': model.name
                }, status=status.HTTP_200_OK)
                
            except MLModel.DoesNotExist:
                return Response({'error': 'Model does not exist'}, status=status.HTTP_404_NOT_FOUND)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TrainingStatusView(APIView):
    """
    Training Status Query View
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, task_id):
        """
        Query training status
        """
        try:
            training_log = ModelTrainingLog.objects.get(id=task_id)
            serializer = ModelTrainingLogSerializer(training_log)
            return Response(serializer.data)
            
        except ModelTrainingLog.DoesNotExist:
            return Response({'error': 'Training log does not exist'}, status=status.HTTP_404_NOT_FOUND)


class PredictStockPriceView(APIView):
    """
    Stock Price Prediction View
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """
        Predict stock price
        """
        serializer = PredictStockSerializer(data=request.data)
        if serializer.is_valid():
            model_id = serializer.validated_data['model_id']
            stock_symbol = serializer.validated_data['stock_symbol']
            prediction_date = serializer.validated_data['prediction_date']
            
            try:
                model = MLModel.objects.get(id=model_id)
                stock = Stock.objects.get(symbol=stock_symbol)
                
                # Here should call machine learning model for prediction
                # In actual project, trained model would be loaded for prediction
                # This is just an example with mock data
                
                # Check if prediction record already exists
                existing_prediction = StockPrediction.objects.filter(
                    model=model,
                    stock=stock,
                    prediction_date=prediction_date
                ).first()
                
                if existing_prediction:
                    serializer = StockPredictionSerializer(existing_prediction)
                    return Response(serializer.data)
                
                # Create new prediction record
                # Using mock data here
                prediction = StockPrediction.objects.create(
                    model=model,
                    stock=stock,
                    prediction_date=prediction_date,
                    input_sequence_start=prediction_date,
                    input_sequence_end=prediction_date,
                    predicted_price=100.00,  # Mock predicted price
                    confidence_score=0.85,
                    prediction_range_low=95.00,
                    prediction_range_high=105.00,
                    created_by=request.user
                )
                
                serializer = StockPredictionSerializer(prediction)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
                
            except MLModel.DoesNotExist:
                return Response({'error': 'Model does not exist'}, status=status.HTTP_404_NOT_FOUND)
            except Stock.DoesNotExist:
                return Response({'error': 'Stock does not exist'}, status=status.HTTP_404_NOT_FOUND)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BatchPredictView(APIView):
    """
    Batch Prediction View
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """
        Batch predict multiple stocks
        """
        model_id = request.data.get('model_id')
        stock_symbols = request.data.get('stock_symbols', [])
        prediction_date = request.data.get('prediction_date')
        
        if not model_id or not stock_symbols or not prediction_date:
            return Response({
                'error': 'Model ID, stock symbols list and prediction date cannot be empty'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            model = MLModel.objects.get(id=model_id)
            results = []
            
            for symbol in stock_symbols:
                try:
                    stock = Stock.objects.get(symbol=symbol)
                    
                    # Check if prediction record already exists
                    existing_prediction = StockPrediction.objects.filter(
                        model=model,
                        stock=stock,
                        prediction_date=prediction_date
                    ).first()
                    
                    if existing_prediction:
                        serializer = StockPredictionSerializer(existing_prediction)
                        results.append(serializer.data)
                    else:
                        # Create new prediction record (using mock data)
                        prediction = StockPrediction.objects.create(
                            model=model,
                            stock=stock,
                            prediction_date=prediction_date,
                            input_sequence_start=prediction_date,
                            input_sequence_end=prediction_date,
                            predicted_price=100.00,  # Mock predicted price
                            confidence_score=0.85,
                            prediction_range_low=95.00,
                            prediction_range_high=105.00,
                            created_by=request.user
                        )
                        
                        serializer = StockPredictionSerializer(prediction)
                        results.append(serializer.data)
                        
                except Stock.DoesNotExist:
                    results.append({
                        'symbol': symbol,
                        'error': f'Stock {symbol} does not exist'
                    })
            
            return Response({
                'message': f'Batch prediction completed, processed {len(stock_symbols)} stocks',
                'results': results
            }, status=status.HTTP_200_OK)
            
        except MLModel.DoesNotExist:
            return Response({'error': 'Model does not exist'}, status=status.HTTP_404_NOT_FOUND)


class PredictionHistoryView(generics.ListAPIView):
    """
    Prediction History List View
    """
    serializer_class = StockPredictionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Get prediction history, optionally filtered by model and stock
        """
        queryset = StockPrediction.objects.all()
        model_id = self.request.query_params.get('model_id')
        stock_symbol = self.request.query_params.get('stock_symbol')
        
        if model_id:
            queryset = queryset.filter(model_id=model_id)
        
        if stock_symbol:
            queryset = queryset.filter(stock__symbol=stock_symbol)
        
        return queryset.order_by('-created_at')


class PredictionDetailView(generics.RetrieveAPIView):
    """
    Prediction Detail View
    """
    serializer_class = StockPredictionSerializer
    permission_classes = [IsAuthenticated]
    queryset = StockPrediction.objects.all()
