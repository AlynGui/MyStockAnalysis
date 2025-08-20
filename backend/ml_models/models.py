from django.db import models
from django.contrib.auth import get_user_model
from stocks.models import Stock

User = get_user_model()


class MLModel(models.Model):
    """
    Machine Learning Model Record
    """
    MODEL_TYPES = [
        ('rnn', 'RNN Recurrent Neural Network'),
        ('lstm', 'LSTM Long Short-Term Memory'),
        ('gru', 'GRU Gated Recurrent Unit'),
        ('cnn', 'CNN Convolutional Neural Network'),
        ('transformer', 'Transformer'),
    ]
    
    STATUS_CHOICES = [
        ('training', 'Training'),
        ('completed', 'Training Completed'),
        ('failed', 'Training Failed'),
        ('active', 'Active'),
        ('deprecated', 'Deprecated'),
    ]
    
    name = models.CharField(max_length=100, verbose_name='Model Name')
    model_type = models.CharField(max_length=20, choices=MODEL_TYPES, verbose_name='Model Type')
    description = models.TextField(blank=True, null=True, verbose_name='Model Description')
    version = models.CharField(max_length=20, default='1.0.0', verbose_name='Version')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='training', verbose_name='Status')
    
    # Model parameters
    sequence_length = models.IntegerField(default=60, verbose_name='Sequence Length')
    prediction_days = models.IntegerField(default=1, verbose_name='Prediction Days')
    hidden_units = models.IntegerField(default=50, verbose_name='Hidden Units')
    learning_rate = models.FloatField(default=0.001, verbose_name='Learning Rate')
    epochs = models.IntegerField(default=100, verbose_name='Training Epochs')
    batch_size = models.IntegerField(default=32, verbose_name='Batch Size')
    
    # Model performance metrics
    train_loss = models.FloatField(blank=True, null=True, verbose_name='Training Loss')
    val_loss = models.FloatField(blank=True, null=True, verbose_name='Validation Loss')
    accuracy = models.FloatField(blank=True, null=True, verbose_name='Accuracy')
    mae = models.FloatField(blank=True, null=True, verbose_name='Mean Absolute Error')
    rmse = models.FloatField(blank=True, null=True, verbose_name='Root Mean Square Error')
    
    # File paths
    model_file_path = models.CharField(max_length=255, blank=True, null=True, verbose_name='Model File Path')
    weights_file_path = models.CharField(max_length=255, blank=True, null=True, verbose_name='Weights File Path')
    
    # Metadata
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Created By')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Created At')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Updated At')
    trained_at = models.DateTimeField(blank=True, null=True, verbose_name='Training Completed At')
    
    class Meta:
        db_table = 'ml_models'
        verbose_name = 'Machine Learning Model'
        verbose_name_plural = 'Machine Learning Models'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} v{self.version}"


class StockPrediction(models.Model):
    """
    Stock Price Prediction Results
    """
    model = models.ForeignKey(MLModel, on_delete=models.CASCADE, related_name='predictions', verbose_name='Model')
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE, related_name='predictions', verbose_name='Stock')
    
    # Prediction parameters
    prediction_date = models.DateField(verbose_name='Prediction Date')
    input_sequence_start = models.DateField(verbose_name='Input Sequence Start Date')
    input_sequence_end = models.DateField(verbose_name='Input Sequence End Date')
    
    # Prediction results
    predicted_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Predicted Price')
    confidence_score = models.FloatField(blank=True, null=True, verbose_name='Confidence Score')
    prediction_range_low = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, verbose_name='Prediction Range Low')
    prediction_range_high = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, verbose_name='Prediction Range High')
    
    # Actual results (for evaluating prediction accuracy)
    actual_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, verbose_name='Actual Price')
    prediction_error = models.FloatField(blank=True, null=True, verbose_name='Prediction Error')
    
    # Metadata
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Created By')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Created At')
    
    class Meta:
        db_table = 'stock_predictions'
        verbose_name = 'Stock Price Prediction'
        verbose_name_plural = 'Stock Price Predictions'
        unique_together = ['model', 'stock', 'prediction_date']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.stock.symbol} - {self.prediction_date} - {self.predicted_price}"


class ModelTrainingLog(models.Model):
    """
    Model Training Log
    """
    STATUS_CHOICES = [
        ('started', 'Training Started'),
        ('processing', 'Training In Progress'),
        ('completed', 'Training Completed'),
        ('failed', 'Training Failed'),
        ('cancelled', 'Training Cancelled'),
    ]
    
    model = models.ForeignKey(MLModel, on_delete=models.CASCADE, related_name='training_logs', verbose_name='Model')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='started', verbose_name='Status')
    
    # Training data information
    training_data_size = models.IntegerField(default=0, verbose_name='Training Data Size')
    validation_data_size = models.IntegerField(default=0, verbose_name='Validation Data Size')
    
    # Training progress
    current_epoch = models.IntegerField(default=0, verbose_name='Current Epoch')
    total_epochs = models.IntegerField(default=0, verbose_name='Total Epochs')
    progress_percentage = models.FloatField(default=0.0, verbose_name='Progress Percentage')
    
    # Training results
    final_train_loss = models.FloatField(blank=True, null=True, verbose_name='Final Training Loss')
    final_val_loss = models.FloatField(blank=True, null=True, verbose_name='Final Validation Loss')
    training_time_seconds = models.IntegerField(blank=True, null=True, verbose_name='Training Time (Seconds)')
    
    # Error information
    error_message = models.TextField(blank=True, null=True, verbose_name='Error Message')
    
    # Metadata
    started_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Started By')
    started_at = models.DateTimeField(auto_now_add=True, verbose_name='Started At')
    completed_at = models.DateTimeField(blank=True, null=True, verbose_name='Completed At')
    
    class Meta:
        db_table = 'model_training_logs'
        verbose_name = 'Model Training Log'
        verbose_name_plural = 'Model Training Logs'
        ordering = ['-started_at']
    
    def __str__(self):
        return f"{self.model.name} - {self.status} - {self.started_at}"


class PredictionAccuracy(models.Model):
    """
    Prediction Accuracy Evaluation
    """
    model = models.ForeignKey(MLModel, on_delete=models.CASCADE, related_name='accuracy_metrics', verbose_name='Model')
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE, blank=True, null=True, verbose_name='Stock')
    
    # Evaluation time range
    evaluation_start_date = models.DateField(verbose_name='Evaluation Start Date')
    evaluation_end_date = models.DateField(verbose_name='Evaluation End Date')
    
    # Accuracy metrics
    total_predictions = models.IntegerField(default=0, verbose_name='Total Predictions')
    correct_predictions = models.IntegerField(default=0, verbose_name='Correct Predictions')
    accuracy_percentage = models.FloatField(default=0.0, verbose_name='Accuracy Percentage')
    
    # Error metrics
    mean_absolute_error = models.FloatField(blank=True, null=True, verbose_name='Mean Absolute Error')
    root_mean_square_error = models.FloatField(blank=True, null=True, verbose_name='Root Mean Square Error')
    mean_absolute_percentage_error = models.FloatField(blank=True, null=True, verbose_name='Mean Absolute Percentage Error')
    
    # Metadata
    calculated_at = models.DateTimeField(auto_now_add=True, verbose_name='Calculated At')
    
    class Meta:
        db_table = 'prediction_accuracy'
        verbose_name = 'Prediction Accuracy'
        verbose_name_plural = 'Prediction Accuracy'
        ordering = ['-calculated_at']
    
    def __str__(self):
        stock_name = self.stock.symbol if self.stock else "All Stocks"
        return f"{self.model.name} - {stock_name} - {self.accuracy_percentage:.2f}%"
