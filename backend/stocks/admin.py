from django.contrib import admin
from .models import Stock, StockPrice, UserFavoriteStock, StockDataImportLog


@admin.register(Stock)
class StockAdmin(admin.ModelAdmin):
    """
    Stock Admin Configuration
    """
    list_display = ('symbol', 'name', 'exchange', 'sector', 'market_cap', 'pe_ratio', 'created_at')
    list_filter = ('exchange', 'sector', 'created_at')
    search_fields = ('symbol', 'name', 'sector', 'industry')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Basic Information', {
            'fields': ('symbol', 'name', 'exchange', 'description')
        }),
        ('Classification', {
            'fields': ('sector', 'industry')
        }),
        ('Financial Data', {
            'fields': ('market_cap', 'pe_ratio', 'pb_ratio', 'dividend_yield')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(StockPrice)
class StockPriceAdmin(admin.ModelAdmin):
    """
    Stock Price Admin Configuration
    """
    list_display = ('stock', 'date', 'close_price', 'volume', 'ma_20', 'rsi', 'created_at')
    list_filter = ('stock', 'date', 'created_at')
    search_fields = ('stock__symbol', 'stock__name')
    readonly_fields = ('created_at',)
    date_hierarchy = 'date'
    fieldsets = (
        ('Basic Information', {
            'fields': ('stock', 'date')
        }),
        ('Price Data', {
            'fields': ('open_price', 'high_price', 'low_price', 'close_price', 'volume')
        }),
        ('Moving Averages', {
            'fields': ('ma_5', 'ma_10', 'ma_20', 'ma_50')
        }),
        ('Exponential Moving Averages', {
            'fields': ('ema_12', 'ema_26')
        }),
        ('Technical Indicators', {
            'fields': ('macd', 'macd_signal', 'macd_histogram', 'rsi')
        }),
        ('Metadata', {
            'fields': ('created_at',)
        }),
    )


@admin.register(UserFavoriteStock)
class UserFavoriteStockAdmin(admin.ModelAdmin):
    """
    User Favorite Stock Admin Configuration
    """
    list_display = ('user', 'stock', 'created_at')
    list_filter = ('stock', 'created_at')
    search_fields = ('user__username', 'user__email', 'stock__symbol', 'stock__name')
    readonly_fields = ('created_at',)
    fieldsets = (
        ('Favorite Information', {
            'fields': ('user', 'stock')
        }),
        ('Metadata', {
            'fields': ('created_at',)
        }),
    )


@admin.register(StockDataImportLog)
class StockDataImportLogAdmin(admin.ModelAdmin):
    """
    Stock Data Import Log Admin Configuration
    """
    list_display = ('import_type', 'status', 'total_records', 'success_records', 'failed_records', 'created_at')
    list_filter = ('import_type', 'status', 'created_at')
    search_fields = ('file_path', 'error_message')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Import Information', {
            'fields': ('import_type', 'status', 'file_path')
        }),
        ('Statistics', {
            'fields': ('total_records', 'success_records', 'failed_records')
        }),
        ('Error Information', {
            'fields': ('error_message',)
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at')
        }),
    )