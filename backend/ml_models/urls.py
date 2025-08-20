from django.urls import path
from . import views

urlpatterns = [
    # Model Management
    path('models/', views.MLModelListView.as_view(), name='ml_model_list'),
    path('models/create/', views.MLModelCreateView.as_view(), name='ml_model_create'),
    path('models/<int:pk>/', views.MLModelDetailView.as_view(), name='ml_model_detail'),
    
    # Model Training
    path('train/', views.TrainModelView.as_view(), name='train_model'),
    path('train/status/<int:task_id>/', views.TrainingStatusView.as_view(), name='training_status'),
    
    # Stock Price Prediction
    path('predict/', views.PredictStockPriceView.as_view(), name='predict_stock_price'),
    path('predict/batch/', views.BatchPredictView.as_view(), name='batch_predict'),
    
    # Prediction History
    path('predictions/', views.PredictionHistoryView.as_view(), name='prediction_history'),
    path('predictions/<int:pk>/', views.PredictionDetailView.as_view(), name='prediction_detail'),
] 