from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal

User = get_user_model()


class Stock(models.Model):
    """
    Stock Basic Information Model
    """
    symbol = models.CharField(max_length=10, unique=True, verbose_name='Stock Symbol')
    name = models.CharField(max_length=100, verbose_name='Stock Name')
    exchange = models.CharField(max_length=10, verbose_name='Exchange')
    sector = models.CharField(max_length=50, blank=True, null=True, verbose_name='Sector')
    industry = models.CharField(max_length=100, blank=True, null=True, verbose_name='Industry')
    market_cap = models.BigIntegerField(blank=True, null=True, verbose_name='Market Cap')
    description = models.TextField(blank=True, null=True, verbose_name='Company Description')
    
    # Stock fundamental data
    pe_ratio = models.FloatField(blank=True, null=True, verbose_name='P/E Ratio')
    pb_ratio = models.FloatField(blank=True, null=True, verbose_name='P/B Ratio')
    dividend_yield = models.FloatField(blank=True, null=True, verbose_name='Dividend Yield')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Created At')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Updated At')
    
    class Meta:
        db_table = 'stocks'
        verbose_name = 'Stock'
        verbose_name_plural = 'Stocks'
        ordering = ['symbol']
    
    def __str__(self):
        return f"{self.symbol} - {self.name}"


class StockPrice(models.Model):
    """
    Stock Price Data Model
    """
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE, related_name='prices', verbose_name='Stock')
    date = models.DateField(verbose_name='Date')
    open_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Open Price')
    high_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='High Price')
    low_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Low Price')
    close_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Close Price')
    volume = models.BigIntegerField(verbose_name='Volume')
    
    # Technical indicators
    ma_5 = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, verbose_name='5-Day MA')
    ma_10 = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, verbose_name='10-Day MA')
    ma_20 = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, verbose_name='20-Day MA')
    ma_50 = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, verbose_name='50-Day MA')
    
    ema_12 = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, verbose_name='12-Day EMA')
    ema_26 = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, verbose_name='26-Day EMA')
    
    macd = models.DecimalField(max_digits=10, decimal_places=4, blank=True, null=True, verbose_name='MACD')
    macd_signal = models.DecimalField(max_digits=10, decimal_places=4, blank=True, null=True, verbose_name='MACD Signal')
    macd_histogram = models.DecimalField(max_digits=10, decimal_places=4, blank=True, null=True, verbose_name='MACD Histogram')
    
    rsi = models.FloatField(
        blank=True, null=True, 
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name='RSI'
    )
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Created At')
    
    class Meta:
        db_table = 'stock_prices'
        verbose_name = 'Stock Price'
        verbose_name_plural = 'Stock Prices'
        unique_together = ['stock', 'date']
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.stock.symbol} - {self.date}"


class UserFavoriteStock(models.Model):
    """
    User Favorite Stock Model
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorite_stocks', verbose_name='User')
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE, related_name='favorited_by', verbose_name='Stock')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Created At')
    
    class Meta:
        db_table = 'user_favorite_stocks'
        verbose_name = 'User Favorite Stock'
        verbose_name_plural = 'User Favorite Stocks'
        unique_together = ['user', 'stock']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.stock.symbol}"


class StockDataImportLog(models.Model):
    """
    Stock Data Import Log Model
    """
    import_type = models.CharField(
        max_length=20,
        choices=[
            ('api', 'API Import'),
            ('excel', 'Excel Import'),
            ('csv', 'CSV Import'),
        ],
        verbose_name='Import Type'
    )
    
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('processing', 'Processing'),
            ('success', 'Success'),
            ('failed', 'Failed'),
        ],
        default='pending',
        verbose_name='Status'
    )
    
    file_path = models.CharField(max_length=255, blank=True, null=True, verbose_name='File Path')
    total_records = models.IntegerField(default=0, verbose_name='Total Records')
    success_records = models.IntegerField(default=0, verbose_name='Success Records')
    failed_records = models.IntegerField(default=0, verbose_name='Failed Records')
    error_message = models.TextField(blank=True, null=True, verbose_name='Error Message')
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Created By')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Created At')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Updated At')
    
    class Meta:
        db_table = 'stock_data_import_logs'
        verbose_name = 'Stock Data Import Log'
        verbose_name_plural = 'Stock Data Import Logs'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.import_type} - {self.status} - {self.created_at}"
