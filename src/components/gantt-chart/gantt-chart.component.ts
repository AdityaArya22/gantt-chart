import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface Task {
  name: string;
  assignedTo: string;
  type: 'To-Do' | 'Buffer' | 'Duration';
  startDate: string;
  endDate: string;
  buffer?: number;
}

type ViewMode = 'Day' | 'Month' | 'Year';

@Component({
  selector: 'app-gantt-chart',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './gantt-chart.component.html',
  styleUrls: ['./gantt-chart.component.scss'],
})
export class GanttChartComponent implements OnInit {
  tasks: Task[] = [];
  newTask: Task = {
    name: '',
    assignedTo: '',
    type: 'To-Do',
    startDate: '',
    endDate: '',
    buffer: 0,
  };

  viewMode: ViewMode = 'Day'; // Default view
  viewStartDate: Date = new Date(); // Starting date for the current view
  viewEndDate: Date = new Date(); // End date for the current view
  
  // Configuration
  dayWidth: number = 60; // Width for each day in Day view
  monthWidth: number = 120; // Width for each month in Month view
  yearWidth: number = 200; // Width for each year in Year view
  
  // Display range configuration
  daysToShow: number = 28; // Days to display in Day view
  monthsToShow: number = 12; // Months to display in Month view
  yearsToShow: number = 5; // Years to display in Year view

  ngOnInit() {
    this.updateViewDates();
    this.getTasks()
  }
  getTasks(){
   let item = localStorage.getItem("chart_item");
   item ? this.tasks = JSON.parse(item) : []
  }
  updateViewDates() {
    // Set view end date based on view mode
    this.viewEndDate = new Date(this.viewStartDate);
    
    if (this.viewMode === 'Day') {
      this.viewEndDate.setDate(this.viewStartDate.getDate() + this.daysToShow - 1);
    } else if (this.viewMode === 'Month') {
      this.viewEndDate.setMonth(this.viewStartDate.getMonth() + this.monthsToShow - 1);
    } else if (this.viewMode === 'Year') {
      this.viewEndDate.setFullYear(this.viewStartDate.getFullYear() + this.yearsToShow - 1);
    }
  }

  addTask() {
    // Validate dates
    if (new Date(this.newTask.startDate) > new Date(this.newTask.endDate)) {
      alert('End date must be after start date');
      return;
    }
    
    this.tasks.push({ ...this.newTask });
    localStorage.setItem("chart_item",JSON.stringify(this.tasks))
    this.newTask = { name: '', assignedTo: '', type: 'To-Do', startDate: '', endDate: '', buffer: 0 };
  }

  // Set default date values for the form
  setDefaultDates() {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    this.newTask.startDate = today.toISOString().split('T')[0];
    this.newTask.endDate = tomorrow.toISOString().split('T')[0];
  }

  changeViewMode(mode: ViewMode) {
    this.viewMode = mode;
    // Reset to appropriate start date when switching views
    this.viewStartDate = new Date();
    
    // For Month view, set to first day of current month
    if (this.viewMode === 'Month') {
      this.viewStartDate.setDate(1);
    }
    
    // For Year view, set to January 1st of current year
    if (this.viewMode === 'Year') {
      this.viewStartDate.setMonth(0);
      this.viewStartDate.setDate(1);
    }
    
    this.updateViewDates();
  }

  // Navigation methods
  navigateDate(amount: number) {
    if (this.viewMode === 'Day') {
      this.viewStartDate.setDate(this.viewStartDate.getDate() + amount);
    } else if (this.viewMode === 'Month') {
      this.viewStartDate.setMonth(this.viewStartDate.getMonth() + amount);
    } else if (this.viewMode === 'Year') {
      this.viewStartDate.setFullYear(this.viewStartDate.getFullYear() + amount);
    }
    
    this.viewStartDate = new Date(this.viewStartDate); // Create new instance to trigger change detection
    this.updateViewDates();
  }

  // Go to today/current period
  goToCurrent() {
    this.viewStartDate = new Date();
    
    if (this.viewMode === 'Month') {
      this.viewStartDate.setDate(1); // First day of current month
    } else if (this.viewMode === 'Year') {
      this.viewStartDate.setMonth(0); // January
      this.viewStartDate.setDate(1); // 1st day
    }
    
    this.updateViewDates();
  }

  // Format the current date range for display
  formatDateRange(): string {
    if (this.viewMode === 'Day') {
      return `${this.viewStartDate.toLocaleDateString('default', { month: 'short', day: 'numeric' })} - ${this.viewEndDate.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else if (this.viewMode === 'Month') {
      return `${this.viewStartDate.toLocaleDateString('default', { month: 'short', year: 'numeric' })} - ${this.viewEndDate.toLocaleDateString('default', { month: 'short', year: 'numeric' })}`;
    } else {
      return `${this.viewStartDate.getFullYear()} - ${this.viewEndDate.getFullYear()}`;
    }
  }

  getTimelineLabels(): string[] {
    const labels: string[] = [];
    
    if (this.viewMode === 'Day') {
      const currentDate = new Date(this.viewStartDate);
      for (let i = 0; i < this.daysToShow; i++) {
        labels.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else if (this.viewMode === 'Month') {
      const currentDate = new Date(this.viewStartDate);
      for (let i = 0; i < this.monthsToShow; i++) {
        labels.push(currentDate.toISOString().split('T')[0]);
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    } else if (this.viewMode === 'Year') {
      const currentDate = new Date(this.viewStartDate);
      for (let i = 0; i < this.yearsToShow; i++) {
        labels.push(currentDate.getFullYear().toString());
        currentDate.setFullYear(currentDate.getFullYear() + 1);
      }
    }

    return labels;
  }

  // Helper methods for Day view formatting
  getDayName(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('default', { weekday: 'short' });
  }

  formatDayDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('default', { month: 'short', day: 'numeric' });
  }

  formatMonthDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('default', { month: 'short', year: 'numeric' });
  }

  isToday(dateStr: string): boolean {
    const today = new Date();
    const date = new Date(dateStr);
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  }

  isCurrentMonth(dateStr: string): boolean {
    const today = new Date();
    const date = new Date(dateStr);
    return date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  }

  isCurrentYear(year: string): boolean {
    const today = new Date();
    return today.getFullYear().toString() === year;
  }

  isWeekend(dateStr: string): boolean {
    const date = new Date(dateStr);
    const day = date.getDay();
    return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
  }

  formatTaskDateRange(task: Task): string {
    const start = new Date(task.startDate);
    const end = new Date(task.endDate);
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  }

  filterTasksByView(): Task[] {
    const viewStart = new Date(this.viewStartDate);
    const viewEnd = new Date(this.viewEndDate);
    
    return this.tasks.filter(task => {
      const taskStart = new Date(task.startDate);
      const taskEnd = new Date(task.endDate);
      
      // Show task if it overlaps with the current view range
      return (taskStart <= viewEnd && taskEnd >= viewStart);
    });
  }

  // Calculate position and width for tasks in all views
  getTaskPosition(task: Task): { left: number, width: number } {
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);
    const viewStart = new Date(this.viewStartDate);
    
    let left = 0;
    let width = 0;
    
    // Calculate the effective start date (max of task start and view start)
    const effectiveStart = new Date(Math.max(taskStart.getTime(), viewStart.getTime()));
    
    if (this.viewMode === 'Day') {
      // Days difference between effective start and view start
      const startDiff = (effectiveStart.getTime() - viewStart.getTime()) / (1000 * 60 * 60 * 24);
      left = startDiff * this.dayWidth;
      
      // Calculate width based on days within view
      const viewEnd = new Date(this.viewEndDate);
      const effectiveEnd = new Date(Math.min(taskEnd.getTime(), viewEnd.getTime()));
      const daysDuration = (effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24);
      width = Math.max(this.dayWidth / 2, daysDuration * this.dayWidth);
      
    } else if (this.viewMode === 'Month') {
      // Calculate months difference for the left position
      const startMonths = (effectiveStart.getFullYear() - viewStart.getFullYear()) * 12 
                          + effectiveStart.getMonth() - viewStart.getMonth();
      left = startMonths * this.monthWidth;
      
      // Calculate width based on months within view
      const viewEnd = new Date(this.viewEndDate);
      viewEnd.setMonth(viewEnd.getMonth() + 1, 0); // Last day of the end month
      
      const effectiveEnd = new Date(Math.min(taskEnd.getTime(), viewEnd.getTime()));
      const endMonths = (effectiveEnd.getFullYear() - effectiveStart.getFullYear()) * 12 
                        + effectiveEnd.getMonth() - effectiveStart.getMonth();
      
      // Add fractional month calculation for more accuracy
      const startFraction = effectiveStart.getDate() / new Date(effectiveStart.getFullYear(), effectiveStart.getMonth() + 1, 0).getDate();
      const endFraction = effectiveEnd.getDate() / new Date(effectiveEnd.getFullYear(), effectiveEnd.getMonth() + 1, 0).getDate();
      
      width = Math.max(this.monthWidth / 3, (endMonths + endFraction - startFraction) * this.monthWidth);
      
    } else if (this.viewMode === 'Year') {
      // Calculate years difference
      const startYears = effectiveStart.getFullYear() - viewStart.getFullYear();
      left = startYears * this.yearWidth;
      
      // Calculate width based on years within view
      const viewEnd = new Date(this.viewEndDate);
      viewEnd.setMonth(11, 31); // Last day of the end year
      
      const effectiveEnd = new Date(Math.min(taskEnd.getTime(), viewEnd.getTime()));
      const endYears = effectiveEnd.getFullYear() - effectiveStart.getFullYear();
      
      // Add fractional year calculation
      const startDayOfYear = (effectiveStart.getTime() - new Date(effectiveStart.getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24);
      const endDayOfYear = (effectiveEnd.getTime() - new Date(effectiveEnd.getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24);
      
      const startFraction = startDayOfYear / (isLeapYear(effectiveStart.getFullYear()) ? 366 : 365);
      const endFraction = endDayOfYear / (isLeapYear(effectiveEnd.getFullYear()) ? 366 : 365);
      
      width = Math.max(this.yearWidth / 4, (endYears + endFraction - startFraction) * this.yearWidth);
    }
    
    // Apply buffer if specified
    if (task.type === 'Buffer' && task.buffer) {
      if (this.viewMode === 'Day') {
        width += task.buffer * this.dayWidth;
      } else if (this.viewMode === 'Month') {
        width += (task.buffer / 30) * this.monthWidth; // Approximate
      } else if (this.viewMode === 'Year') {
        width += (task.buffer / 365) * this.yearWidth; // Approximate
      }
    }
    
    return { left, width };
  }

  getColor(type: string): string {
    switch (type) {
      case 'To-Do': return '#8a2be2'; // Purple
      case 'Buffer': return '#ffcc00'; // Yellow
      case 'Duration': return '#32cd32'; // Vibrant Green
      default: return '#ccc';
    }
  }

  // Get text color for contrast
  getTextColor(type: string): string {
    switch (type) {
      case 'To-Do': return '#ffffff'; // White text on purple
      case 'Buffer': return '#000000'; // Black text on yellow
      case 'Duration': return '#ffffff'; // White text on green
      default: return '#000000';
    }
  }

  // Go to today
  goToToday() {
    this.viewStartDate = new Date();
  }
}

// Helper function for leap year calculation
function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}
  // Navigation for day view

