from django.contrib import admin
from .models import MLModel, StockPrediction, ModelTrainingLog, PredictionAccuracy


@admin.register(MLModel)
class MLModelAdmin(admin.ModelAdmin):
    """
    Machine Learning Model Admin Configuration
    """
    list_display = ('name', 'model_type', 'version', 'status', 'accuracy', 'created_at', 'trained_at')
    list_filter = ('model_type', 'status', 'created_at')
    search_fields = ('name', 'description')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'model_type', 'description', 'version', 'status')
        }),
        ('Model Parameters', {
            'fields': ('sequence_length', 'prediction_days', 'hidden_units', 'learning_rate', 'epochs', 'batch_size')
        }),
        ('Performance Metrics', {
            'fields': ('train_loss', 'val_loss', 'accuracy', 'mae', 'rmse')
        }),
        ('File Paths', {
            'fields': ('model_file_path', 'weights_file_path')
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at', 'trained_at')
        }),
    )


@admin.register(StockPrediction)
class StockPredictionAdmin(admin.ModelAdmin):
    """
    Stock Prediction Admin Configuration
    """
    list_display = ('stock', 'model', 'prediction_date', 'predicted_price', 'actual_price', 'confidence_score', 'created_at')
    list_filter = ('model', 'prediction_date', 'created_at')
    search_fields = ('stock__symbol', 'stock__name')
    readonly_fields = ('created_at',)
    fieldsets = (
        ('Prediction Information', {
            'fields': ('model', 'stock', 'prediction_date')
        }),
        ('Input Parameters', {
            'fields': ('input_sequence_start', 'input_sequence_end')
        }),
        ('Prediction Results', {
            'fields': ('predicted_price', 'confidence_score', 'prediction_range_low', 'prediction_range_high')
        }),
        ('Actual Results', {
            'fields': ('actual_price', 'prediction_error')
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at')
        }),
    )


@admin.register(ModelTrainingLog)
class ModelTrainingLogAdmin(admin.ModelAdmin):
    """
    Model Training Log Admin Configuration
    """
    list_display = ('model', 'status', 'progress_percentage', 'current_epoch', 'total_epochs', 'started_at', 'completed_at')
    list_filter = ('status', 'started_at')
    search_fields = ('model__name',)
    readonly_fields = ('started_at', 'completed_at')
    fieldsets = (
        ('Training Information', {
            'fields': ('model', 'status')
        }),
        ('Data Information', {
            'fields': ('training_data_size', 'validation_data_size')
        }),
        ('Progress Information', {
            'fields': ('current_epoch', 'total_epochs', 'progress_percentage')
        }),
        ('Results', {
            'fields': ('final_train_loss', 'final_val_loss', 'training_time_seconds')
        }),
        ('Error Information', {
            'fields': ('error_message',)
        }),
        ('Metadata', {
            'fields': ('started_by', 'started_at', 'completed_at')
        }),
    )


@admin.register(PredictionAccuracy)
class PredictionAccuracyAdmin(admin.ModelAdmin):
    """
    Prediction Accuracy Admin Configuration
    """
    list_display = ('model', 'stock', 'accuracy_percentage', 'total_predictions', 'correct_predictions', 'calculated_at')
    list_filter = ('model', 'evaluation_start_date', 'evaluation_end_date', 'calculated_at')
    search_fields = ('model__name', 'stock__symbol', 'stock__name')
    readonly_fields = ('calculated_at',)
    fieldsets = (
        ('Evaluation Information', {
            'fields': ('model', 'stock', 'evaluation_start_date', 'evaluation_end_date')
        }),
        ('Accuracy Metrics', {
            'fields': ('total_predictions', 'correct_predictions', 'accuracy_percentage')
        }),
        ('Error Metrics', {
            'fields': ('mean_absolute_error', 'root_mean_square_error', 'mean_absolute_percentage_error')
        }),
        ('Metadata', {
            'fields': ('calculated_at',)
        }),
    )
