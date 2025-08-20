import pandas as pd
import numpy as np
from typing import List, Dict, Any
from decimal import Decimal
from datetime import datetime, date
import yfinance as yf
from .models import Stock, StockPrice


def calculate_ma(prices: List[float], period: int) -> List[float]:
    """
    Calculate Moving Average (MA)
    
    Args:
        prices: List of prices
        period: Period
    
    Returns:
        List of moving averages
    """
    if len(prices) < period:
        return [None] * len(prices)
    
    ma_values = []
    for i in range(len(prices)):
        if i < period - 1:
            ma_values.append(None)
        else:
            ma_values.append(sum(prices[i-period+1:i+1]) / period)
    
    return ma_values


def calculate_ema(prices: List[float], period: int) -> List[float]:
    """
    Calculate Exponential Moving Average (EMA)
    
    Args:
        prices: List of prices
        period: Period
    
    Returns:
        List of exponential moving averages
    """
    if len(prices) < period:
        return [None] * len(prices)
    
    multiplier = 2 / (period + 1)
    ema_values = []
    
    # First value uses SMA
    sma = sum(prices[:period]) / period
    ema_values.extend([None] * (period - 1))
    ema_values.append(sma)
    
    # Subsequent values use EMA formula
    for i in range(period, len(prices)):
        ema = (prices[i] * multiplier) + (ema_values[i-1] * (1 - multiplier))
        ema_values.append(ema)
    
    return ema_values


def calculate_macd(prices: List[float], fast_period: int = 12, slow_period: int = 26, signal_period: int = 9) -> Dict[str, List[float]]:
    """
    Calculate MACD Indicator
    
    Args:
        prices: List of prices
        fast_period: Fast line period
        slow_period: Slow line period
        signal_period: Signal line period
    
    Returns:
        Dictionary containing MACD, signal line, histogram
    """
    ema_fast = calculate_ema(prices, fast_period)
    ema_slow = calculate_ema(prices, slow_period)
    
    # Calculate MACD line
    macd_line = []
    for i in range(len(prices)):
        if ema_fast[i] is None or ema_slow[i] is None:
            macd_line.append(None)
        else:
            macd_line.append(ema_fast[i] - ema_slow[i])
    
    # Calculate signal line
    macd_signal = calculate_ema([x for x in macd_line if x is not None], signal_period)
    
    # Pad with None values
    signal_values = [None] * (len(macd_line) - len(macd_signal)) + macd_signal
    
    # Calculate histogram
    histogram = []
    for i in range(len(macd_line)):
        if macd_line[i] is None or signal_values[i] is None:
            histogram.append(None)
        else:
            histogram.append(macd_line[i] - signal_values[i])
    
    return {
        'macd': macd_line,
        'signal': signal_values,
        'histogram': histogram
    }


def calculate_rsi(prices: List[float], period: int = 14) -> List[float]:
    """
    Calculate RSI Indicator
    
    Args:
        prices: List of prices
        period: Period
    
    Returns:
        List of RSI values
    """
    if len(prices) < period + 1:
        return [None] * len(prices)
    
    # Calculate price changes
    price_changes = []
    for i in range(1, len(prices)):
        price_changes.append(prices[i] - prices[i-1])
    
    # Separate gains and losses
    gains = [max(change, 0) for change in price_changes]
    losses = [-min(change, 0) for change in price_changes]
    
    rsi_values = [None]  # First value is None
    
    # Calculate initial average values
    avg_gain = sum(gains[:period]) / period
    avg_loss = sum(losses[:period]) / period
    
    # Calculate RSI
    for i in range(period, len(price_changes)):
        if avg_loss == 0:
            rsi = 100
        else:
            rs = avg_gain / avg_loss
            rsi = 100 - (100 / (1 + rs))
        
        rsi_values.append(rsi)
        
        # Update average values
        avg_gain = ((avg_gain * (period - 1)) + gains[i]) / period
        avg_loss = ((avg_loss * (period - 1)) + losses[i]) / period
    
    return rsi_values


def update_technical_indicators(stock_symbol: str) -> bool:
    """
    Update technical indicators for stock
    
    Args:
        stock_symbol: Stock symbol
    
    Returns:
        Whether update was successful
    """
    try:
        stock = Stock.objects.get(symbol=stock_symbol)
        prices = StockPrice.objects.filter(stock=stock).order_by('date')
        
        if not prices.exists():
            return False
        
        # Get price data
        close_prices = [float(price.close_price) for price in prices]
        
        # Calculate technical indicators
        ma_5 = calculate_ma(close_prices, 5)
        ma_10 = calculate_ma(close_prices, 10)
        ma_20 = calculate_ma(close_prices, 20)
        ma_50 = calculate_ma(close_prices, 50)
        
        ema_12 = calculate_ema(close_prices, 12)
        ema_26 = calculate_ema(close_prices, 26)
        
        macd_data = calculate_macd(close_prices)
        rsi_values = calculate_rsi(close_prices)
        
        # Update database
        for i, price in enumerate(prices):
            price.ma_5 = Decimal(str(ma_5[i])) if ma_5[i] is not None else None
            price.ma_10 = Decimal(str(ma_10[i])) if ma_10[i] is not None else None
            price.ma_20 = Decimal(str(ma_20[i])) if ma_20[i] is not None else None
            price.ma_50 = Decimal(str(ma_50[i])) if ma_50[i] is not None else None
            
            price.ema_12 = Decimal(str(ema_12[i])) if ema_12[i] is not None else None
            price.ema_26 = Decimal(str(ema_26[i])) if ema_26[i] is not None else None
            
            price.macd = Decimal(str(macd_data['macd'][i])) if macd_data['macd'][i] is not None else None
            price.macd_signal = Decimal(str(macd_data['signal'][i])) if macd_data['signal'][i] is not None else None
            price.macd_histogram = Decimal(str(macd_data['histogram'][i])) if macd_data['histogram'][i] is not None else None
            
            price.rsi = rsi_values[i] if rsi_values[i] is not None else None
            price.save()
        
        return True
        
    except Exception as e:
        print(f"Error updating technical indicators for {stock_symbol}: {e}")
        return False


def fetch_stock_data_from_yfinance(symbol: str, period: str = "1y") -> Dict[str, Any]:
    """
    Fetch stock data from Yahoo Finance
    
    Args:
        symbol: Stock symbol
        period: Data period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
    
    Returns:
        Dictionary containing stock data and metadata
    """
    try:
        ticker = yf.Ticker(symbol)
        
        # Get stock info
        info = ticker.info
        
        # Get historical data
        hist = ticker.history(period=period)
        
        if hist.empty:
            return {'success': False, 'error': f'No data found for symbol {symbol}'}
        
        # Prepare stock basic information
        stock_data = {
            'symbol': symbol,
            'name': info.get('longName', symbol),
            'exchange': info.get('exchange', ''),
            'sector': info.get('sector', ''),
            'industry': info.get('industry', ''),
            'market_cap': info.get('marketCap'),
            'description': info.get('longBusinessSummary', ''),
            'pe_ratio': info.get('trailingPE'),
            'pb_ratio': info.get('priceToBook'),
            'dividend_yield': info.get('dividendYield'),
        }
        
        # Prepare price data
        price_data = []
        for date_idx, row in hist.iterrows():
            price_data.append({
                'date': date_idx.date(),
                'open_price': float(row['Open']),
                'high_price': float(row['High']),
                'low_price': float(row['Low']),
                'close_price': float(row['Close']),
                'volume': int(row['Volume'])
            })
        
        return {
            'success': True,
            'stock_data': stock_data,
            'price_data': price_data
        }
        
    except Exception as e:
        return {'success': False, 'error': str(e)}


def import_stock_data(symbol: str) -> bool:
    """
    Import stock data from external API
    
    Args:
        symbol: Stock symbol
    
    Returns:
        Whether import was successful
    """
    try:
        # Fetch data from Yahoo Finance
        result = fetch_stock_data_from_yfinance(symbol)
        
        if not result['success']:
            print(f"Failed to fetch data for {symbol}: {result['error']}")
            return False
        
        stock_data = result['stock_data']
        price_data = result['price_data']
        
        # Create or update stock
        stock, created = Stock.objects.update_or_create(
            symbol=symbol,
            defaults=stock_data
        )
        
        # Import price data
        for price_record in price_data:
            StockPrice.objects.update_or_create(
                stock=stock,
                date=price_record['date'],
                defaults=price_record
            )
        
        # Update technical indicators
        update_technical_indicators(symbol)
        
        print(f"Successfully imported data for {symbol}")
        return True
        
    except Exception as e:
        print(f"Error importing stock data for {symbol}: {e}")
        return False


def parse_excel_data(file_path: str) -> List[Dict[str, Any]]:
    """
    Parse Excel file and extract stock data
    
    Args:
        file_path: Path to Excel file
    
    Returns:
        List of stock data dictionaries
    """
    try:
        # Read Excel file
        df = pd.read_excel(file_path)
        
        # Check required columns
        required_columns = ['symbol']
        for col in required_columns:
            if col not in df.columns:
                raise ValueError(f"Missing required column: {col}")
        
        # Convert to list of dictionaries
        data_list = []
        for _, row in df.iterrows():
            stock_data = {
                'symbol': str(row['symbol']).upper(),
                'name': str(row.get('name', '')),
                'exchange': str(row.get('exchange', '')),
                'sector': str(row.get('sector', '')),
                'industry': str(row.get('industry', '')),
                'market_cap': row.get('market_cap') if pd.notna(row.get('market_cap')) else None,
                'description': str(row.get('description', '')),
                'pe_ratio': row.get('pe_ratio') if pd.notna(row.get('pe_ratio')) else None,
                'pb_ratio': row.get('pb_ratio') if pd.notna(row.get('pb_ratio')) else None,
                'dividend_yield': row.get('dividend_yield') if pd.notna(row.get('dividend_yield')) else None,
            }
            
            data_list.append(stock_data)
        
        return data_list
        
    except Exception as e:
        raise ValueError(f"Error parsing Excel file: {e}")


def validate_stock_data(data: Dict[str, Any]) -> bool:
    """
    Validate stock data format
    
    Args:
        data: Stock data dictionary
    
    Returns:
        Whether data is valid
    """
    required_fields = ['symbol']
    
    for field in required_fields:
        if field not in data or not data[field]:
            return False
    
    # Validate symbol format
    if not isinstance(data['symbol'], str) or len(data['symbol']) > 10:
        return False
    
    return True 