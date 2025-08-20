from rest_framework import serializers
from .models import MLModel, StockPrediction, ModelTrainingLog, PredictionAccuracy
from stocks.models import Stock


class MLModelSerializer(serializers.ModelSerializer):
    """
    Machine Learning Model Serializer
    """
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    prediction_count = serializers.SerializerMethodField()
    
    class Meta:
        model = MLModel
        fields = [
            'id', 'name', 'model_type', 'description', 'version', 'status',
            'sequence_length', 'prediction_days', 'hidden_units', 'learning_rate',
            'epochs', 'batch_size', 'train_loss', 'val_loss', 'accuracy',
            'mae', 'rmse', 'model_file_path', 'weights_file_path',
            'created_by_username', 'prediction_count', 'created_at', 'updated_at', 'trained_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'trained_at']
    
    def get_prediction_count(self, obj):
        """
        Get the number of predictions for this model
        """
        return obj.predictions.count()


class StockPredictionSerializer(serializers.ModelSerializer):
    """
    Stock Prediction Serializer
    """
    model_name = serializers.CharField(source='model.name', read_only=True)
    stock_symbol = serializers.CharField(source='stock.symbol', read_only=True)
    stock_name = serializers.CharField(source='stock.name', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = StockPrediction
        fields = [
            'id', 'model', 'stock', 'model_name', 'stock_symbol', 'stock_name',
            'prediction_date', 'input_sequence_start', 'input_sequence_end',
            'predicted_price', 'confidence_score', 'prediction_range_low',
            'prediction_range_high', 'actual_price', 'prediction_error',
            'created_by_username', 'created_at'
        ]


class ModelTrainingLogSerializer(serializers.ModelSerializer):
    """
    Model Training Log Serializer
    """
    model_name = serializers.CharField(source='model.name', read_only=True)
    started_by_username = serializers.CharField(source='started_by.username', read_only=True)
    
    class Meta:
        model = ModelTrainingLog
        fields = [
            'id', 'model', 'model_name', 'status', 'training_data_size',
            'validation_data_size', 'current_epoch', 'total_epochs',
            'progress_percentage', 'final_train_loss', 'final_val_loss',
            'training_time_seconds', 'error_message', 'started_by_username',
            'started_at', 'completed_at'
        ]


class PredictionAccuracySerializer(serializers.ModelSerializer):
    """
    Prediction Accuracy Serializer
    """
    model_name = serializers.CharField(source='model.name', read_only=True)
    stock_symbol = serializers.CharField(source='stock.symbol', read_only=True)
    
    class Meta:
        model = PredictionAccuracy
        fields = [
            'id', 'model', 'stock', 'model_name', 'stock_symbol',
            'evaluation_start_date', 'evaluation_end_date', 'total_predictions',
            'correct_predictions', 'accuracy_percentage', 'mean_absolute_error',
            'root_mean_square_error', 'mean_absolute_percentage_error',
            'calculated_at'
        ]


class TrainModelSerializer(serializers.Serializer):
    """
    Train Model Serializer
    """
    model_id = serializers.IntegerField()
    stock_symbol = serializers.CharField(max_length=10, required=False)
    
    def validate_model_id(self, value):
        """
        Validate if model exists
        """
        if not MLModel.objects.filter(id=value).exists():
            raise serializers.ValidationError('Model does not exist')
        return value
    
    def validate_stock_symbol(self, value):
        """
        Validate if stock exists
        """
        if value and not Stock.objects.filter(symbol=value).exists():
            raise serializers.ValidationError('Stock does not exist')
        return value


class PredictStockSerializer(serializers.Serializer):
    """
    Stock Prediction Serializer
    """
    model_id = serializers.IntegerField()
    stock_symbol = serializers.CharField(max_length=10)
    prediction_date = serializers.DateField()
    
    def validate_model_id(self, value):
        """
        Validate if model exists and is available
        """
        try:
            model = MLModel.objects.get(id=value)
            if model.status not in ['active', 'completed']:
                raise serializers.ValidationError('Model is not available, please select a trained model')
        except MLModel.DoesNotExist:
            raise serializers.ValidationError('Model does not exist')
        return value
    
    def validate_stock_symbol(self, value):
        """
        Validate if stock exists
        """
        if not Stock.objects.filter(symbol=value).exists():
            raise serializers.ValidationError('Stock does not exist')
        return value


class BatchPredictSerializer(serializers.Serializer):
    """
    Batch Prediction Serializer
    """
    model_id = serializers.IntegerField()
    stock_symbols = serializers.ListField(
        child=serializers.CharField(max_length=10),
        min_length=1,
        max_length=50
    )
    prediction_date = serializers.DateField()
    
    def validate_model_id(self, value):
        """
        Validate if model exists and is available
        """
        try:
            model = MLModel.objects.get(id=value)
            if model.status not in ['active', 'completed']:
                raise serializers.ValidationError('Model is not available, please select a trained model')
        except MLModel.DoesNotExist:
            raise serializers.ValidationError('Model does not exist')
        return value
    
    def validate_stock_symbols(self, value):
        """
        Validate stock symbol list
        """
        # Remove duplicates
        unique_symbols = list(set(value))
        
        # Validate if stocks exist
        existing_stocks = Stock.objects.filter(symbol__in=unique_symbols)
        existing_symbols = [stock.symbol for stock in existing_stocks]
        
        invalid_symbols = [symbol for symbol in unique_symbols if symbol not in existing_symbols]
        if invalid_symbols:
            raise serializers.ValidationError(f'The following stock symbols do not exist: {", ".join(invalid_symbols)}')
        
        return unique_symbols 