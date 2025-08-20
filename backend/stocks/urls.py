from django.urls import path
from . import views

urlpatterns = [
    # stock list
    path('', views.StockListView.as_view(), name='stock_list'),
    path('search/', views.StockSearchView.as_view(), name='stock_search'),
    
    # stock detail
    path('<str:symbol>/', views.StockDetailView.as_view(), name='stock_detail'),
    path('<str:symbol>/prices/', views.StockPriceListView.as_view(), name='stock_prices'),
    path('<str:symbol>/technical/', views.TechnicalIndicatorsView.as_view(), name='technical_indicators'),
    
    # favorite
    path('favorite/add/', views.AddFavoriteStockView.as_view(), name='add_favorite'),
    path('favorite/remove/', views.RemoveFavoriteStockView.as_view(), name='remove_favorite'),
    path('favorite/list/', views.FavoriteStockListView.as_view(), name='favorite_list'),
    
    # import data
    # path('import/excel/', views.ExcelImportView.as_view(), name='import_excel'),
    # path('import/api/', views.ImportAPIDataView.as_view(), name='import_api'),
    # path('import/logs/', views.ImportLogListView.as_view(), name='import_logs'),

] 