# Stock Price Analysis Platform

## Project Overview
This is a comprehensive stock price analysis platform that helps users analyze stock data and predict prices. The platform provides stock data import, technical indicator analysis, and price prediction capabilities.

## Technology Stack
- **Frontend**: React.js + Chart.js/Recharts
- **Backend**: Python3 + Django + Django REST Framework
- **Database**: PostgreSQL
- **Machine Learning**: RNN model (price prediction)

## Main Feature Modules

### 1. User Module
- **Login Page**: Support username/password login with registration and password recovery links
- **Registration Page**: User registration functionality with username and password setup
- **Change Password Page**: User password reset functionality

### 2. Stock Data Module
- **Background Tasks**: Automatically import NASDAQ full market stock data (basic info, historical prices, real-time prices)
- **Excel Import**: Manual stock data import as backup solution
- **Favorite Stocks**: Search and favorite stocks, view favorite list
- **Stock Details Page**: View detailed information and price trends for individual stocks
- **Technical Indicator Analysis**: Support for MA, EMA, MACD, RSI and other technical indicators
- **Price Model Analysis**: Use RNN model to predict stock prices

### 3. Role Management Module
- **Role Management**: Set menu permissions for different roles (Admin/Regular User)
- **User Management**: Assign roles to users


## Installation and Setup

### Prerequisites
- Python 3.8+
- Node.js 16+
- PostgreSQL 12+

### Backend Setup
1. Create virtual environment
```bash
cd backend
python -m venv venv
source venv/bin/activate  
```

2. Install dependencies
```bash
pip install -r requirements.txt
```

3. Configure database
```bash
python manage.py migrate
python manage.py createsuperuser
```

4. Import sample stock data
```bash
python manage.py import_stock_data --days=60
```

5. Start backend service
```bash
python manage.py runserver
```

### Frontend Setup
1. Install dependencies
```bash
cd frontend
npm install
```

2. Start frontend service
```bash
npm start
```

### Access Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Admin Interface: http://localhost:8000/admin



