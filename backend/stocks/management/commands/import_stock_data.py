from django.core.management.base import BaseCommand
from django.utils import timezone
from stocks.models import Stock, StockPrice
from decimal import Decimal
import random
from datetime import datetime, timedelta

class Command(BaseCommand):
    help = 'Import stock data into database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Number of days of historical data to generate'
        )

    def handle(self, *args, **options):
        days = options['days']
        
        # Stock data from frontend
        stock_data = [
            {
                'symbol': 'AAPL',
                'name': 'Apple Inc.',
                'exchange': 'NASDAQ',
                'sector': 'Technology',
                'industry': 'Consumer Electronics',
                'pe_ratio': 28.5,
                'pb_ratio': 8.2,
                'dividend_yield': 0.52,
                'base_price': 175.20
            },
            {
                'symbol': 'GOOGL',
                'name': 'Alphabet Inc.',
                'exchange': 'NASDAQ',
                'sector': 'Technology',
                'industry': 'Internet Services',
                'pe_ratio': 25.8,
                'pb_ratio': 4.5,
                'dividend_yield': 0.0,
                'base_price': 2450.30
            },
            {
                'symbol': 'MSFT',
                'name': 'Microsoft Corporation',
                'exchange': 'NASDAQ',
                'sector': 'Technology',
                'industry': 'Software',
                'pe_ratio': 32.1,
                'pb_ratio': 10.3,
                'dividend_yield': 0.68,
                'base_price': 310.45
            },
            {
                'symbol': 'TSLA',
                'name': 'Tesla Inc.',
                'exchange': 'NASDAQ',
                'sector': 'Automotive',
                'industry': 'Electric Vehicles',
                'pe_ratio': 65.4,
                'pb_ratio': 12.8,
                'dividend_yield': 0.0,
                'base_price': 245.80
            },
            {
                'symbol': 'AMZN',
                'name': 'Amazon.com Inc.',
                'exchange': 'NASDAQ',
                'sector': 'E-commerce',
                'industry': 'Internet Retail',
                'pe_ratio': 45.2,
                'pb_ratio': 6.9,
                'dividend_yield': 0.0,
                'base_price': 3250.45
            },
            {
                'symbol': 'META',
                'name': 'Meta Platforms Inc.',
                'exchange': 'NASDAQ',
                'sector': 'Technology',
                'industry': 'Social Media',
                'pe_ratio': 22.8,
                'pb_ratio': 3.2,
                'dividend_yield': 0.0,
                'base_price': 295.67
            },
            {
                'symbol': 'NVDA',
                'name': 'NVIDIA Corporation',
                'exchange': 'NASDAQ',
                'sector': 'Semiconductors',
                'industry': 'GPU Manufacturing',
                'pe_ratio': 78.9,
                'pb_ratio': 15.6,
                'dividend_yield': 0.09,
                'base_price': 875.28
            },
            {
                'symbol': 'JPM',
                'name': 'JPMorgan Chase & Co.',
                'exchange': 'NYSE',
                'sector': 'Financial',
                'industry': 'Banking',
                'pe_ratio': 12.5,
                'pb_ratio': 1.8,
                'dividend_yield': 2.85,
                'base_price': 142.35
            },
            {
                'symbol': 'JNJ',
                'name': 'Johnson & Johnson',
                'exchange': 'NYSE',
                'sector': 'Healthcare',
                'industry': 'Pharmaceuticals',
                'pe_ratio': 18.2,
                'pb_ratio': 3.2,
                'dividend_yield': 2.95,
                'base_price': 158.90
            },
            {
                'symbol': 'V',
                'name': 'Visa Inc.',
                'exchange': 'NYSE',
                'sector': 'Financial',
                'industry': 'Payment Processing',
                'pe_ratio': 35.8,
                'pb_ratio': 12.5,
                'dividend_yield': 0.78,
                'base_price': 245.67
            }
        ]

        self.stdout.write(self.style.SUCCESS('Starting stock data import...'))
        
        stocks_created = 0
        prices_created = 0
        
        for stock_info in stock_data:
            # Create or update stock
            stock, created = Stock.objects.get_or_create(
                symbol=stock_info['symbol'],
                defaults={
                    'name': stock_info['name'],
                    'exchange': stock_info['exchange'],
                    'sector': stock_info['sector'],
                    'industry': stock_info['industry'],
                    'pe_ratio': stock_info['pe_ratio'],
                    'pb_ratio': stock_info['pb_ratio'],
                    'dividend_yield': stock_info['dividend_yield'],
                    'market_cap': random.randint(100000000, 3000000000000),  # Random market cap
                    'description': f'{stock_info["name"]} is a leading company in {stock_info["sector"]}.'
                }
            )
            
            if created:
                stocks_created += 1
                self.stdout.write(f'Created stock: {stock.symbol} - {stock.name}')
            
            # Generate historical price data
            base_price = stock_info['base_price']
            current_date = timezone.now().date() - timedelta(days=days)
            
            for i in range(days):
                trade_date = current_date + timedelta(days=i)
                
                # Skip weekends
                if trade_date.weekday() >= 5:
                    continue
                
                # Generate price data with some randomness
                price_change = (random.random() - 0.5) * 0.05  # -2.5% to +2.5%
                adjusted_price = base_price * (1 + price_change)
                
                # Generate OHLC data
                open_price = adjusted_price * (0.995 + random.random() * 0.01)
                high_price = max(open_price, adjusted_price) * (1 + random.random() * 0.02)
                low_price = min(open_price, adjusted_price) * (1 - random.random() * 0.02)
                close_price = adjusted_price
                volume = random.randint(1000000, 100000000)
                
                # Create price record
                price_obj, price_created = StockPrice.objects.get_or_create(
                    stock=stock,
                    date=trade_date,
                    defaults={
                        'open_price': Decimal(str(round(open_price, 2))),
                        'high_price': Decimal(str(round(high_price, 2))),
                        'low_price': Decimal(str(round(low_price, 2))),
                        'close_price': Decimal(str(round(close_price, 2))),
                        'volume': volume,
                        # Add some technical indicators
                        'ma_5': Decimal(str(round(close_price * 0.98, 2))),
                        'ma_20': Decimal(str(round(close_price * 0.95, 2))),
                        'rsi': random.randint(20, 80)
                    }
                )
                
                if price_created:
                    prices_created += 1
                
                # Update base price for next day
                base_price = close_price
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Stock data import completed!\n'
                f'Stocks created: {stocks_created}\n'
                f'Price records created: {prices_created}'
            )
        ) 