from rest_framework import serializers
from .models import Stock, StockPrice, UserFavoriteStock, StockDataImportLog


class StockSerializer(serializers.ModelSerializer):
    """
    Stock Basic Information Serializer
    """
    latest_price = serializers.SerializerMethodField()
    is_favorited = serializers.SerializerMethodField()
    
    class Meta:
        model = Stock
        fields = [
            'id', 'symbol', 'name', 'exchange', 'sector', 'industry',
            'market_cap', 'description', 'pe_ratio', 'pb_ratio', 'dividend_yield',
            'created_at', 'updated_at', 'latest_price', 'is_favorited'
        ]
    
    def get_latest_price(self, obj):
        """
        Get latest price
        """
        latest_price = obj.prices.first()
        if latest_price:
            return {
                'close_price': latest_price.close_price,
                'date': latest_price.date,
                'volume': latest_price.volume
            }
        return None
    
    def get_is_favorited(self, obj):
        """
        Check if favorited by current user
        """
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return UserFavoriteStock.objects.filter(
                user=request.user, 
                stock=obj
            ).exists()
        return False


class StockPriceSerializer(serializers.ModelSerializer):
    """
    Stock Price Data Serializer
    """
    stock_symbol = serializers.CharField(source='stock.symbol', read_only=True)
    
    class Meta:
        model = StockPrice
        fields = [
            'id', 'stock_symbol', 'date', 'open_price', 'high_price', 
            'low_price', 'close_price', 'volume', 'ma_5', 'ma_10', 
            'ma_20', 'ma_50', 'ema_12', 'ema_26', 'macd', 'macd_signal', 
            'macd_histogram', 'rsi', 'created_at'
        ]


class UserFavoriteStockSerializer(serializers.ModelSerializer):
    """
    User Favorite Stock Serializer
    """
    stock = StockSerializer(read_only=True)
    
    class Meta:
        model = UserFavoriteStock
        fields = ['id', 'stock', 'created_at']


class StockDataImportLogSerializer(serializers.ModelSerializer):
    """
    Stock Data Import Log Serializer
    """
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = StockDataImportLog
        fields = [
            'id', 'import_type', 'status', 'file_path', 'total_records',
            'success_records', 'failed_records', 'error_message',
            'created_by_username', 'created_at', 'updated_at'
        ]


class TechnicalIndicatorSerializer(serializers.Serializer):
    """
    Technical Indicator Data Serializer
    """
    date = serializers.DateField()
    close_price = serializers.DecimalField(max_digits=10, decimal_places=2)
    ma_5 = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True)
    ma_10 = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True)
    ma_20 = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True)
    ma_50 = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True)
    ema_12 = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True)
    ema_26 = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True)
    macd = serializers.DecimalField(max_digits=10, decimal_places=4, allow_null=True)
    macd_signal = serializers.DecimalField(max_digits=10, decimal_places=4, allow_null=True)
    macd_histogram = serializers.DecimalField(max_digits=10, decimal_places=4, allow_null=True)
    rsi = serializers.FloatField(allow_null=True)


class StockImportSerializer(serializers.Serializer):
    """
    Stock Data Import Serializer
    """
    symbol = serializers.CharField(max_length=10, required=True)
    period = serializers.CharField(max_length=10, default='1y')


class ExcelImportSerializer(serializers.Serializer):
    """
    Excel File Import Serializer
    """
    file = serializers.FileField(required=True)
    
    def validate_file(self, value):
        """
        Validate uploaded file
        """
        if not value.name.endswith(('.xlsx', '.xls')):
            raise serializers.ValidationError('Only Excel file formats are supported (.xlsx, .xls)')
        
        # Check file size (10MB limit)
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError('File size cannot exceed 10MB')
        
        return value 