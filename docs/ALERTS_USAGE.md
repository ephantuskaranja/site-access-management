# Alert System Usage Guide

## Overview
The Site Access Management System includes a built-in alert system for user notifications. Alerts automatically appear at the top of the page and disappear after 5 seconds.

## Alert Types

### 1. Success Alerts (Green)
Used for successful operations:
```javascript
app.showAlert('Vehicle registered successfully!', 'success');
```

### 2. Error/Danger Alerts (Red)
Used for errors and failures:
```javascript
app.showAlert('Failed to register vehicle', 'danger');
```

### 3. Warning Alerts (Yellow/Orange)
Used for warnings and cautions:
```javascript
app.showAlert('Vehicle is in maintenance mode', 'warning');
```

### 4. Info Alerts (Blue)
Used for general information:
```javascript
app.showAlert('Loading vehicle data...', 'info');
```

## How to Use Alerts

### Basic Usage
```javascript
// Simple info alert (default)
app.showAlert('Operation completed');

// Specific type alert
app.showAlert('Message here', 'success');
app.showAlert('Message here', 'danger');
app.showAlert('Message here', 'warning');
app.showAlert('Message here', 'info');
```

### In Form Submissions
```javascript
async function handleFormSubmit(event) {
    event.preventDefault();
    
    try {
        const response = await fetch('/api/endpoint', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            app.showAlert('Operation successful!', 'success');
            // Close modal, refresh data, etc.
        } else {
            app.showAlert(result.message || 'Operation failed', 'danger');
        }
    } catch (error) {
        app.showAlert('Network error occurred', 'danger');
    }
}
```

### In AJAX Responses
```javascript
fetch('/api/vehicles')
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            app.showAlert('Vehicles loaded successfully', 'success');
            renderVehicles(data.data);
        } else {
            app.showAlert('Failed to load vehicles', 'danger');
        }
    })
    .catch(error => {
        app.showAlert('Error loading vehicles', 'danger');
    });
```

## Alert Features

### Auto-Dismiss
- Alerts automatically disappear after 5 seconds
- No manual intervention required

### Stacking
- Multiple alerts can appear simultaneously
- Newer alerts appear at the top

### Positioning
- Alerts appear at the top of the main container
- Always visible to users

## Best Practices

### 1. Use Appropriate Types
```javascript
// ✅ Good
app.showAlert('Vehicle deleted successfully', 'success');
app.showAlert('Invalid license plate format', 'danger');
app.showAlert('Vehicle requires maintenance', 'warning');
app.showAlert('Loading vehicle details...', 'info');

// ❌ Avoid
app.showAlert('Vehicle deleted successfully', 'danger'); // Wrong type
```

### 2. Clear Messages
```javascript
// ✅ Good
app.showAlert('Vehicle "ABC-123" registered successfully', 'success');

// ❌ Avoid
app.showAlert('Success', 'success'); // Too vague
```

### 3. Handle Different Scenarios
```javascript
if (response.success) {
    app.showAlert('Vehicle updated successfully', 'success');
    closeModal();
    loadVehicles();
} else if (response.message) {
    app.showAlert(response.message, 'danger');
} else {
    app.showAlert('An unexpected error occurred', 'danger');
}
```

## Integration Examples

### Vehicle Operations
```javascript
// Vehicle registration
async function registerVehicle(vehicleData) {
    try {
        const response = await fetch('/api/vehicles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(vehicleData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            app.showAlert(`Vehicle ${vehicleData.licensePlate} registered successfully!`, 'success');
            closeModal('vehicleRegistrationModal');
            loadVehicles();
        } else {
            app.showAlert(result.message || 'Failed to register vehicle', 'danger');
        }
    } catch (error) {
        app.showAlert('Network error: Unable to register vehicle', 'danger');
    }
}

// Vehicle deletion
async function deleteVehicle(vehicleId, licensePlate) {
    if (confirm(`Are you sure you want to delete vehicle ${licensePlate}?`)) {
        try {
            const response = await fetch(`/api/vehicles/${vehicleId}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.success) {
                app.showAlert(`Vehicle ${licensePlate} deleted successfully`, 'success');
                loadVehicles();
            } else {
                app.showAlert(result.message || 'Failed to delete vehicle', 'danger');
            }
        } catch (error) {
            app.showAlert('Error deleting vehicle', 'danger');
        }
    }
}
```

### User Authentication
```javascript
// Login
async function handleLogin(credentials) {
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        
        const result = await response.json();
        
        if (result.success) {
            app.showAlert('Login successful! Redirecting...', 'success');
            setTimeout(() => window.location.href = '/dashboard', 1000);
        } else {
            app.showAlert(result.message || 'Login failed', 'danger');
        }
    } catch (error) {
        app.showAlert('Login error: Please try again', 'danger');
    }
}
```

## CSS Classes
The alert system uses Bootstrap-style classes:
- `.alert` - Base alert class
- `.alert-success` - Green success alerts
- `.alert-danger` - Red error alerts
- `.alert-warning` - Yellow warning alerts
- `.alert-info` - Blue info alerts

## Customization
To modify alert behavior, edit the `showAlert` function in `/public/js/app.js`:

```javascript
showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    const container = document.querySelector('.container') || document.body;
    container.insertBefore(alertDiv, container.firstChild);
    
    // Auto remove after 5 seconds (customizable)
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}
```

## Testing Alerts
You can test alerts in the browser console:
```javascript
// Test different alert types
app.showAlert('This is a success message', 'success');
app.showAlert('This is an error message', 'danger');
app.showAlert('This is a warning message', 'warning');
app.showAlert('This is an info message', 'info');
```