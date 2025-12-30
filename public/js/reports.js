// Reports JavaScript
document.addEventListener('DOMContentLoaded', function() {

    // Global variables
    let reportFiltersForm, generateReportBtn, exportReportBtn, reportResults, reportLoading, reportError;
    let reportTitle, reportMeta, summaryCards, reportTableHead, reportTableBody, dateRangeSelect, customDateRangeFields;
    let currentReportData = null;
    let reportChart = null;

    // Wait for all required libraries to load
    const checkLibraries = () => {
        const chartLoaded = typeof Chart !== 'undefined';
        const xlsxLoaded = typeof XLSX !== 'undefined';
        const jspdfLoaded = typeof window.jspdf !== 'undefined';

        return chartLoaded && xlsxLoaded && jspdfLoaded;
    };

    if (!checkLibraries()) {
        const checkLibs = setInterval(() => {
            if (checkLibraries()) {
                clearInterval(checkLibs);
                initializeReports();
            }
        }, 100);

        // Timeout after 15 seconds
        setTimeout(() => {
            clearInterval(checkLibs);
            console.warn('Some libraries failed to load within 15 seconds, proceeding with available features');
            initializeReports();
        }, 15000);
    } else {
        initializeReports();
    }

    function initializeReports() {

        // DOM Elements
        reportFiltersForm = document.getElementById('reportFiltersForm');
        generateReportBtn = document.getElementById('generateReportBtn');
        exportReportBtn = document.getElementById('exportReportBtn');
        reportResults = document.getElementById('reportResults');
        reportLoading = document.getElementById('reportLoading');
        reportError = document.getElementById('reportError');
        reportTitle = document.getElementById('reportTitle');
        reportMeta = document.getElementById('reportMeta');
        summaryCards = document.getElementById('summaryCards');
        reportTableHead = document.getElementById('reportTableHead');
        reportTableBody = document.getElementById('reportTableBody');
        dateRangeSelect = document.getElementById('dateRange');
        customDateRangeFields = document.querySelectorAll('.custom-date-range');
        exportFormatSelect = document.getElementById('exportFormat');

        // Event Listeners
        generateReportBtn.addEventListener('click', generateReport);
        exportReportBtn.addEventListener('click', exportReport);
        dateRangeSelect.addEventListener('change', toggleCustomDateRange);

        // Set default dates
        setDefaultDateRange();
    }

    function setDefaultDateRange() {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        document.getElementById('startDate').value = startOfMonth.toISOString().split('T')[0];
        document.getElementById('endDate').value = today.toISOString().split('T')[0];
    }

    function toggleCustomDateRange() {
        const display = dateRangeSelect.value === 'custom' ? 'block' : 'none';
        customDateRangeFields.forEach(field => {
            field.style.display = display;
        });
    }

    async function generateReport() {
        const formData = new FormData(reportFiltersForm);
        const reportType = formData.get('reportType');
        const dateRange = formData.get('dateRange');

        // Calculate date range
        const { startDate, endDate } = calculateDateRange(dateRange, formData);

        // Show loading
        showLoading();

        try {
            const response = await makeApiRequest(`/reports/${reportType}?startDate=${startDate}&endDate=${endDate}`);

            if (response && response.success) {
                currentReportData = response.data;
                displayReport(reportType, response.data, startDate, endDate);
                showResults();
            } else {
                showError(response?.message || 'Failed to generate report');
            }
        } catch (error) {
            console.error('Error generating report:', error);
            showError('An error occurred while generating the report');
        } finally {
            hideLoading();
        }
    }

    function calculateDateRange(dateRange, formData) {
        const today = new Date();
        let startDate, endDate;

        switch (dateRange) {
            case 'today':
                startDate = new Date(today);
                endDate = new Date(today);
                break;
            case 'yesterday':
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 1);
                endDate = new Date(startDate);
                break;
            case 'last7days':
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 7);
                endDate = new Date(today);
                break;
            case 'last30days':
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 30);
                endDate = new Date(today);
                break;
            case 'custom':
                startDate = new Date(formData.get('startDate'));
                endDate = new Date(formData.get('endDate'));
                break;
            default:
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 7);
                endDate = new Date(today);
        }

        return {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
        };
    }

    function displayReport(reportType, data, startDate, endDate) {
        // Update title and meta
        reportTitle.textContent = getReportTitle(reportType);
        reportMeta.textContent = `Generated on ${new Date().toLocaleString()} | Period: ${startDate} to ${endDate}`;

        // Reset chart display
        const chartContainer = document.getElementById('chartContainer');
        const chartFallback = document.getElementById('chartFallback');
        if (chartContainer) chartContainer.style.display = 'block';
        if (chartFallback) chartFallback.style.display = 'none';

        // Clear previous content
        summaryCards.innerHTML = '';
        reportTableHead.innerHTML = '';
        reportTableBody.innerHTML = '';

        // Display based on report type
        switch (reportType) {
            case 'visitors':
                displayVisitorReport(data);
                break;
            case 'vehicle-movements':
                displayVehicleMovementReport(data);
                break;
            case 'access-logs':
                displayAccessLogReport(data);
                break;
            case 'user-activity':
                displayUserActivityReport(data);
                break;
            case 'security':
                displaySecurityReport(data);
                break;
        }
    }

    function displayVisitorReport(data) {
        // Summary cards
        if (data.statusBreakdown) {
            createSummaryCard('Total Visitors', data.totalVisitors, 'primary');
            createSummaryCard('Checked In', data.statusBreakdown.checked_in || 0, 'success');
            createSummaryCard('Pending', data.statusBreakdown.pending || 0, 'warning');
            createSummaryCard('Checked Out', data.statusBreakdown.checked_out || 0, 'info');
        }

        // Table
        // Removed Email; added Host details (Employee, Dept, Purpose of visit)
        const headers = ['Name', 'Host Employee', 'Dept', 'Purpose of visit', 'Phone', 'Status', 'Check-in Time', 'Check-out Time'];
        createTableHeaders(headers);

        if (data.recentVisitors) {
            data.recentVisitors.forEach(visitor => {
                const hostLabel = (visitor.hostDisplayName || visitor.hostEmployee || '').toString();
                const deptLabel = (visitor.hostDepartment || '').toString();
                const purposeLabel = (visitor.visitPurpose || '').toString();
                const row = [
                    `${visitor.firstName} ${visitor.lastName}`,
                    hostLabel || 'N/A',
                    deptLabel || 'N/A',
                    purposeLabel || 'N/A',
                    visitor.phone || 'N/A',
                    formatStatus(visitor.status),
                    visitor.checkInTime ? new Date(visitor.checkInTime).toLocaleString() : 'N/A',
                    visitor.checkOutTime ? new Date(visitor.checkOutTime).toLocaleString() : 'N/A'
                ];
                createTableRow(row);
            });
        }

        // Chart
        createVisitorChart(data);
    }

    function displayVehicleMovementReport(data) {
        // Summary cards
        createSummaryCard('Total Movements', data.totalMovements, 'primary');
        createSummaryCard('Entries', data.movementBreakdown.entry || 0, 'success');
        createSummaryCard('Exits', data.movementBreakdown.exit || 0, 'warning');

        // Table
        const headers = ['Vehicle', 'Driver', 'Movement Type', 'Area', 'Time'];
        createTableHeaders(headers);

        if (data.recentMovements) {
            data.recentMovements.forEach(movement => {
                const row = [
                    movement.vehicle?.licensePlate || 'N/A',
                    movement.driverName || 'N/A',
                    formatMovementType(movement.movementType),
                    movement.area || 'N/A',
                    new Date(movement.createdAt).toLocaleString()
                ];
                createTableRow(row);
            });
        }

        // Chart
        createMovementChart(data);
    }

    function displayAccessLogReport(data) {
        // Summary cards
        createSummaryCard('Total Logs', data.totalLogs, 'primary');
        if (data.visitorActivities) {
            createSummaryCard('Active Visitors', data.visitorActivities.length, 'success');
        }
        if (data.employeeActivities) {
            createSummaryCard('Active Employees', data.employeeActivities.length, 'info');
        }

        // Table for Visitor Activities
        if (data.visitorActivities && data.visitorActivities.length > 0) {
            // Create a section header for visitors
            const visitorSection = document.createElement('div');
            visitorSection.className = 'mb-4';
            visitorSection.innerHTML = `
                <h5 class="mb-3">Visitor Check-in/Check-out Activities</h5>
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Visitor Name</th>
                                <th>Check-in Time</th>
                                <th>Check-out Time</th>
                                <th>Last Activity</th>
                            </tr>
                        </thead>
                        <tbody id="visitorActivityTableBody">
                        </tbody>
                    </table>
                </div>
            `;
            summaryCards.parentNode.insertBefore(visitorSection, summaryCards.nextSibling);

            const visitorTableBody = document.getElementById('visitorActivityTableBody');
            data.visitorActivities.forEach(activity => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${activity.name}</td>
                    <td>${activity.checkInTime ? new Date(activity.checkInTime).toLocaleString() : 'N/A'}</td>
                    <td>${activity.checkOutTime ? new Date(activity.checkOutTime).toLocaleString() : 'N/A'}</td>
                    <td>${new Date(activity.lastActivity).toLocaleString()}</td>
                `;
                visitorTableBody.appendChild(row);
            });
        }

        // Table for Employee Activities
        if (data.employeeActivities && data.employeeActivities.length > 0) {
            // Create a section header for employees
            const employeeSection = document.createElement('div');
            employeeSection.className = 'mb-4';
            employeeSection.innerHTML = `
                <h5 class="mb-3">Employee Check-in/Check-out Activities</h5>
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Employee Name</th>
                                <th>Check-in Time</th>
                                <th>Check-out Time</th>
                                <th>Last Activity</th>
                            </tr>
                        </thead>
                        <tbody id="employeeActivityTableBody">
                        </tbody>
                    </table>
                </div>
            `;
            // Insert after visitor section or after summary cards if no visitors
            const insertAfter = data.visitorActivities && data.visitorActivities.length > 0 ?
                document.querySelector('.table-responsive').parentNode : summaryCards;
            insertAfter.parentNode.insertBefore(employeeSection, insertAfter.nextSibling);

            const employeeTableBody = document.getElementById('employeeActivityTableBody');
            data.employeeActivities.forEach(activity => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${activity.name}</td>
                    <td>${activity.checkInTime ? new Date(activity.checkInTime).toLocaleString() : 'N/A'}</td>
                    <td>${activity.checkOutTime ? new Date(activity.checkOutTime).toLocaleString() : 'N/A'}</td>
                    <td>${new Date(activity.lastActivity).toLocaleString()}</td>
                `;
                employeeTableBody.appendChild(row);
            });
        }

        // Original recent logs table (keep for detailed log viewing)
        const headers = ['User', 'Action', 'Details', 'Timestamp'];
        createTableHeaders(headers);

        if (data.recentLogs) {
            data.recentLogs.forEach(log => {
                // Determine the user who performed the action
                let userName = 'System';
                if (log.employee) {
                    userName = `${log.employee.firstName} ${log.employee.lastName}`;
                } else if (log.guard) {
                    userName = `${log.guard.firstName} ${log.guard.lastName}`;
                } else if (log.visitor) {
                    userName = `${log.visitor.firstName} ${log.visitor.lastName}`;
                }

                const row = [
                    userName,
                    formatAction(log.action),
                    log.details || log.notes || 'N/A',
                    new Date(log.createdAt).toLocaleString()
                ];
                createTableRow(row);
            });
        }
    }

    function displayUserActivityReport(data) {
        // Summary cards
        createSummaryCard('Total Users', data.totalUsers, 'primary');
        createSummaryCard('Active Users', data.activeUsers, 'success');

        // Table
        const headers = ['Name', 'Email', 'Role', 'Status', 'Last Login', 'Activity Count'];
        createTableHeaders(headers);

        if (data.userActivity) {
            data.userActivity.forEach(activity => {
                const row = [
                    activity.user.name,
                    activity.user.email,
                    formatRole(activity.user.role),
                    formatStatus(activity.user.status),
                    activity.lastLogin ? new Date(activity.lastLogin).toLocaleString() : 'Never',
                    activity.activityCount
                ];
                createTableRow(row);
            });
        }
    }

    function displaySecurityReport(data) {
        // Summary cards
        createSummaryCard('Total Incidents', data.totalIncidents, 'danger');

        // Table
        const headers = ['User', 'Incident Type', 'Details', 'Timestamp'];
        createTableHeaders(headers);

        if (data.recentIncidents) {
            data.recentIncidents.forEach(incident => {
                const row = [
                    incident.user ? `${incident.user.firstName} ${incident.user.lastName}` : 'Unknown',
                    formatAction(incident.action),
                    incident.details || 'N/A',
                    new Date(incident.createdAt).toLocaleString()
                ];
                createTableRow(row);
            });
        }
    }

    function createSummaryCard(title, value, type) {
        const card = document.createElement('div');
        card.className = `col-md-3`;
        card.innerHTML = `
            <div class="stat-card ${type}">
                <div class="stat-value">${value}</div>
                <div class="stat-label">${title}</div>
            </div>
        `;
        summaryCards.appendChild(card);
    }

    function createTableHeaders(headers) {
        const headerRow = document.createElement('tr');
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        reportTableHead.appendChild(headerRow);
    }

    function createTableRow(data) {
        const row = document.createElement('tr');
        data.forEach(cellData => {
            const td = document.createElement('td');
            td.textContent = cellData;
            row.appendChild(td);
        });
        reportTableBody.appendChild(row);
    }

    function createVisitorChart(data) {
        const chartContainer = document.getElementById('chartContainer');
        const chartFallback = document.getElementById('chartFallback');

        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not loaded yet, showing fallback');
            if (chartContainer) chartContainer.style.display = 'none';
            if (chartFallback) chartFallback.style.display = 'block';
            return;
        }

        if (chartContainer) chartContainer.style.display = 'block';
        if (chartFallback) chartFallback.style.display = 'none';

        const ctx = document.getElementById('reportChart').getContext('2d');

        if (reportChart) {
            reportChart.destroy();
        }

        if (data.statusBreakdown) {
            reportChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Checked In', 'Checked Out', 'Pending', 'Approved', 'Denied'],
                    datasets: [{
                        data: [
                            data.statusBreakdown.checked_in || 0,
                            data.statusBreakdown.checked_out || 0,
                            data.statusBreakdown.pending || 0,
                            data.statusBreakdown.approved || 0,
                            data.statusBreakdown.denied || 0
                        ],
                        backgroundColor: [
                            '#10b981',
                            '#3b82f6',
                            '#f59e0b',
                            '#8b5cf6',
                            '#ef4444'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }
    }

    function createMovementChart(data) {
        const chartContainer = document.getElementById('chartContainer');
        const chartFallback = document.getElementById('chartFallback');

        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not loaded yet, showing fallback');
            if (chartContainer) chartContainer.style.display = 'none';
            if (chartFallback) chartFallback.style.display = 'block';
            return;
        }

        if (chartContainer) chartContainer.style.display = 'block';
        if (chartFallback) chartFallback.style.display = 'none';

        const ctx = document.getElementById('reportChart').getContext('2d');

        if (reportChart) {
            reportChart.destroy();
        }

        reportChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Entries', 'Exits'],
                datasets: [{
                    label: 'Movements',
                    data: [
                        data.movementBreakdown.entry || 0,
                        data.movementBreakdown.exit || 0
                    ],
                    backgroundColor: ['#10b981', '#ef4444']
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    function getReportTitle(reportType) {
        const titles = {
            'visitors': 'Visitor Report',
            'vehicle-movements': 'Vehicle Movement Report',
            'access-logs': 'Access Log Report',
            'user-activity': 'User Activity Report',
            'security': 'Security Report'
        };
        return titles[reportType] || 'Report';
    }

    function formatStatus(status) {
        const statusMap = {
            'pending': 'Pending',
            'approved': 'Approved',
            'checked_in': 'Checked In',
            'checked_out': 'Checked Out',
            'denied': 'Denied',
            'active': 'Active',
            'inactive': 'Inactive'
        };
        return statusMap[status] || status;
    }

    function formatMovementType(type) {
        return type === 'entry' ? 'Entry' : 'Exit';
    }

    function formatAction(action) {
        const actionMap = {
            'login': 'Login',
            'logout': 'Logout',
            'login_failed': 'Failed Login',
            'access_denied': 'Access Denied',
            'visitor_checkin': 'Visitor Check-in',
            'visitor_checkout': 'Visitor Check-out',
            'vehicle_entry': 'Vehicle Entry',
            'vehicle_exit': 'Vehicle Exit'
        };
        return actionMap[action] || action;
    }

    function formatRole(role) {
        const roleMap = {
            'admin': 'Administrator',
            'security_guard': 'Security Guard',
            'receptionist': 'Receptionist'
        };
        return roleMap[role] || role;
    }

    async function exportReport() {
        if (!currentReportData) {
            showToast('Please generate a report first', 'warning');
            return;
        }

        const exportFormat = exportFormatSelect.value;
        const reportType = document.getElementById('reportType').value;
        const fileName = `${reportType}_report_${new Date().toISOString().split('T')[0]}`;

        // Check if required libraries are loaded
        if ((exportFormat === 'excel' && typeof XLSX === 'undefined') ||
            (exportFormat === 'pdf' && typeof window.jspdf === 'undefined')) {
            showToast('Export library not loaded. Please refresh the page and try again.', 'error');
            return;
        }

        try {
            switch (exportFormat) {
                case 'excel':
                    await exportToExcel(currentReportData, reportType, fileName);
                    break;
                case 'pdf':
                    await exportToPDF(currentReportData, reportType, fileName);
                    break;
                case 'csv':
                    exportToCSV(currentReportData, reportType, fileName);
                    break;
                default:
                    showToast('Invalid export format selected', 'error');
            }
        } catch (error) {
            console.error('Export error:', error);
            showToast('Failed to export report', 'error');
        }
    }

    // Export Functions
    async function exportToExcel(data, reportType, fileName) {
        if (typeof XLSX === 'undefined') {
            showToast('Excel export library not loaded. Please refresh the page.', 'error');
            return;
        }

        const workbook = XLSX.utils.book_new();

        // Create summary sheet
        const summaryData = createSummaryData(data, reportType);
        const summarySheet = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

        // Create detailed data sheet
        const detailData = createDetailData(data, reportType);
        if (detailData.length > 0) {
            const detailSheet = XLSX.utils.json_to_sheet(detailData);
            XLSX.utils.book_append_sheet(workbook, detailSheet, 'Details');
        }

        // Save file
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
        showToast('Excel file exported successfully!', 'success');
    }

    async function exportToPDF(data, reportType, fileName) {
        if (typeof window.jspdf === 'undefined') {
            showToast('PDF export library not loaded. Please refresh the page.', 'error');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Add title
        doc.setFontSize(20);
        doc.text(getReportTitle(reportType), 20, 20);

        // Add metadata
        doc.setFontSize(10);
        const generationTime = new Date().toLocaleString();
        doc.text(`Generated: ${generationTime}`, 20, 30);

        // Function to add footer to current page
        const addFooter = () => {
            const pageHeight = doc.internal.pageSize.height;
            const pageWidth = doc.internal.pageSize.width;

            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');

            // Add footer text
            const footerText = `This is a system-generated report. Generated on: ${generationTime}`;
            const textWidth = doc.getTextWidth(footerText);
            const xPosition = (pageWidth - textWidth) / 2; // Center the text
            const yPosition = pageHeight - 15;

            doc.text(footerText, xPosition, yPosition);

            // Add a subtle border
            doc.setLineWidth(0.5);
            doc.line(20, yPosition - 5, pageWidth - 20, yPosition - 5);
        };

        // Add summary data
        const summaryData = createSummaryData(data, reportType);
        if (summaryData.length > 0) {
            doc.setFontSize(14);
            doc.setFont('helvetica', 'normal');
            doc.text('Summary', 20, 45);

            const summaryTableData = summaryData.map(item => Object.values(item));
            const summaryHeaders = Object.keys(summaryData[0] || {});

            doc.autoTable({
                head: [summaryHeaders],
                body: summaryTableData,
                startY: 50,
                styles: { fontSize: 8 },
                headStyles: { fillColor: [41, 128, 185] },
                didDrawPage: addFooter
            });
        }

        // Add detailed data
        const detailData = createDetailData(data, reportType);
        if (detailData.length > 0) {
            const pageHeight = doc.internal.pageSize.height;
            let currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : 70;

            if (currentY > pageHeight - 50) {
                doc.addPage();
                currentY = 20;
            }

            doc.setFontSize(14);
            doc.setFont('helvetica', 'normal');
            doc.text('Detailed Data', 20, currentY);

            const detailTableData = detailData.map(item => Object.values(item));
            const detailHeaders = Object.keys(detailData[0] || {});

            doc.autoTable({
                head: [detailHeaders],
                body: detailTableData,
                startY: currentY + 5,
                styles: { fontSize: 7 },
                headStyles: { fillColor: [52, 152, 219] },
                didDrawPage: addFooter
            });
        }

        // Add footer to the last page if no tables were drawn
        if (!summaryData.length && !detailData.length) {
            addFooter();
        }

        // Save file
        doc.save(`${fileName}.pdf`);
        showToast('PDF file exported successfully!', 'success');
    }

    function exportToCSV(data, reportType, fileName) {
        const detailData = createDetailData(data, reportType);
        if (detailData.length === 0) {
            showToast('No data to export', 'warning');
            return;
        }

        const headers = Object.keys(detailData[0]);
        const csvContent = [
            headers.join(','),
            ...detailData.map(row => headers.map(header => {
                const value = row[header];
                // Escape commas and quotes in CSV
                if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value || '';
            }).join(','))
        ].join('\n');

        // Add BOM for Excel compatibility
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${fileName}.csv`;
        link.click();

        showToast('CSV file exported successfully!', 'success');
    }

    function createSummaryData(data, reportType) {
        const summary = [];

        switch (reportType) {
            case 'visitors':
                if (data.statusBreakdown) {
                    summary.push(
                        { Metric: 'Total Visitors', Value: data.totalVisitors },
                        { Metric: 'Checked In', Value: data.statusBreakdown.checked_in || 0 },
                        { Metric: 'Checked Out', Value: data.statusBreakdown.checked_out || 0 },
                        { Metric: 'Pending', Value: data.statusBreakdown.pending || 0 },
                        { Metric: 'Approved', Value: data.statusBreakdown.approved || 0 }
                    );
                }
                break;
            case 'vehicle-movements':
                if (data.movementBreakdown) {
                    summary.push(
                        { Metric: 'Total Movements', Value: data.totalMovements },
                        { Metric: 'Entries', Value: data.movementBreakdown.entry || 0 },
                        { Metric: 'Exits', Value: data.movementBreakdown.exit || 0 }
                    );
                }
                break;
            case 'access-logs':
                summary.push(
                    { Metric: 'Total Logs', Value: data.totalLogs },
                    { Metric: 'Visitor Activities', Value: data.visitorActivities?.length || 0 },
                    { Metric: 'Employee Activities', Value: data.employeeActivities?.length || 0 }
                );
                break;
            case 'user-activity':
                summary.push(
                    { Metric: 'Total Users', Value: data.totalUsers },
                    { Metric: 'Active Users', Value: data.activeUsers }
                );
                break;
            case 'security':
                summary.push({ Metric: 'Total Incidents', Value: data.totalIncidents });
                break;
        }

        return summary;
    }

    function createDetailData(data, reportType) {
        switch (reportType) {
            case 'visitors':
                return (data.recentVisitors || []).map(visitor => ({
                    'First Name': visitor.firstName,
                    'Last Name': visitor.lastName,
                    'Host Employee': (visitor.hostDisplayName || visitor.hostEmployee || ''),
                    'Host Department': (visitor.hostDepartment || ''),
                    'Visit Purpose': visitor.visitPurpose,
                    'Phone': visitor.phone,
                    'Company': visitor.company || '',
                    'Status': formatStatus(visitor.status),
                    'Check-in Time': visitor.checkInTime ? new Date(visitor.checkInTime).toLocaleString() : 'N/A',
                    'Check-out Time': visitor.checkOutTime ? new Date(visitor.checkOutTime).toLocaleString() : 'N/A',
                    'Created': new Date(visitor.createdAt).toLocaleString()
                }));
            case 'vehicle-movements':
                return (data.recentMovements || []).map(movement => ({
                    'Vehicle': movement.vehicle?.licensePlate || 'N/A',
                    'Driver': movement.driverName || 'N/A',
                    'Movement Type': formatMovementType(movement.movementType),
                    'Area': movement.area || 'N/A',
                    'Time': new Date(movement.createdAt).toLocaleString()
                }));
            case 'access-logs':
                const visitorData = (data.visitorActivities || []).map(activity => ({
                    'Type': 'Visitor',
                    'Name': activity.name,
                    'Check-in Time': activity.checkInTime ? new Date(activity.checkInTime).toLocaleString() : 'N/A',
                    'Check-out Time': activity.checkOutTime ? new Date(activity.checkOutTime).toLocaleString() : 'N/A',
                    'Last Activity': new Date(activity.lastActivity).toLocaleString()
                }));
                const employeeData = (data.employeeActivities || []).map(activity => ({
                    'Type': 'Employee',
                    'Name': activity.name,
                    'Check-in Time': activity.checkInTime ? new Date(activity.checkInTime).toLocaleString() : 'N/A',
                    'Check-out Time': activity.checkOutTime ? new Date(activity.checkOutTime).toLocaleString() : 'N/A',
                    'Last Activity': new Date(activity.lastActivity).toLocaleString()
                }));
                return [...visitorData, ...employeeData];
            case 'user-activity':
                return (data.userActivity || []).map(activity => ({
                    'Name': activity.user.name,
                    'Email': activity.user.email,
                    'Role': formatRole(activity.user.role),
                    'Status': formatStatus(activity.user.status),
                    'Last Login': activity.lastLogin ? new Date(activity.lastLogin).toLocaleString() : 'Never',
                    'Activity Count': activity.activityCount
                }));
            case 'security':
                return (data.recentIncidents || []).map(incident => ({
                    'User': incident.user ? `${incident.user.firstName} ${incident.user.lastName}` : 'Unknown',
                    'Incident Type': formatAction(incident.action),
                    'Details': incident.details || 'N/A',
                    'Timestamp': new Date(incident.createdAt).toLocaleString()
                }));
            default:
                return [];
        }
    }

    function showLoading() {
        reportLoading.style.display = 'block';
        reportResults.style.display = 'none';
        reportError.style.display = 'none';
    }

    function hideLoading() {
        reportLoading.style.display = 'none';
    }

    function showResults() {
        reportResults.style.display = 'block';
    }

    function showError(message) {
        reportError.style.display = 'block';
        document.getElementById('errorMessage').textContent = message;
        reportResults.style.display = 'none';
    }

    // API helper function
    async function makeApiRequest(endpoint, options = {}) {
        const token = localStorage.getItem('access_token');
        const url = `/api${endpoint}`;

        const defaultHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        const finalOptions = {
            method: 'GET',
            headers: { ...defaultHeaders, ...options.headers },
            ...options
        };

        try {
            const response = await fetch(url, finalOptions);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    function showToast(message, type = 'info') {
        // Simple toast implementation
        const toast = document.createElement('div');
        toast.className = `alert alert-${type} position-fixed`;
        toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        toast.innerHTML = `
            ${message}
            <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 5000);
    }
});