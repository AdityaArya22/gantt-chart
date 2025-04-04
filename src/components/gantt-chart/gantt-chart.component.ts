import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface Task {
  id:null|number,
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
    id:Date.now(),
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
  daysToShow: number =15; // Days to display in Day view
  monthsToShow: number = 6; // Months to display in Month view
  yearsToShow: number = 5; // Years to display in Year view
  taskBeingEdited: Task | null = null;
 isEditMode:boolean = false
  isModalOpen = false;
  includeWeekends = true; 
  selectedTask: Task | null = null;
  ngOnInit() {
    this.updateViewDates();
    this.getTasks()
  }
  getTasks(){
   let item = localStorage.getItem("chart_item");
   item ? this.tasks = JSON.parse(item) : []
  }
  
  
  updateViewDates(): void {
    const totalDaysToShow = 15;
    const viewStart = new Date(this.viewStartDate);
    this.viewEndDate = new Date(viewStart);
  
    if (this.viewMode === 'Day') {
      if (this.includeWeekends) {
        this.viewEndDate.setDate(viewStart.getDate() + totalDaysToShow - 1);
      } else {
        let daysAdded = 0;
        while (daysAdded < totalDaysToShow - 1) {
          this.viewEndDate.setDate(this.viewEndDate.getDate() + 1);
          const day = this.viewEndDate.getDay();
          if (day !== 0 && day !== 6) {
            daysAdded++;
          }
        }
      }
    } else if (this.viewMode === 'Month') {
      this.viewEndDate.setMonth(viewStart.getMonth() + 5); // Show 6 months
    } else if (this.viewMode === 'Year') {
      this.viewEndDate.setFullYear(viewStart.getFullYear() + 4); // Show 5 years
    }
  }
  

  addTask() {
    // Validate dates
    if (new Date(this.newTask.startDate) > new Date(this.newTask.endDate)) {
        alert('End date must be after start date');
        return;
    }

    // Assign a unique ID before pushing
    const taskWithId = { ...this.newTask, id: Date.now() };
    
    this.tasks.push(taskWithId);
    localStorage.setItem("chart_item", JSON.stringify(this.tasks));

    // Reset the form for the next task
    this.newTask = { id: null, name: '', assignedTo: '', type: 'To-Do', startDate: '', endDate: '', buffer: 0 };

    this.closeModal();
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
      console.log(this.viewMode);
    }
    
    this.updateViewDates();
  }

  // Navigation methods
  navigateDate(amount: number) {
    if (this.viewMode === 'Day') {
      this.viewStartDate.setDate(this.viewStartDate.getDate() + amount);

    }else if (this.viewMode === 'Month') {
      this.viewStartDate.setMonth(this.viewStartDate.getMonth() + amount);
    }
     else if (this.viewMode === 'Year') {
      this.viewStartDate.setFullYear(this.viewStartDate.getFullYear() + amount);
    }
    
    // this.viewStartDate = new Date(this.viewStartDate); // Create new instance to trigger change detection
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
    const start = new Date(this.viewStartDate);
    const end = new Date(this.viewEndDate);
  
    if (this.viewMode === 'Day') {
      return `${start.toLocaleDateString('default', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else if (this.viewMode === 'Month') {
      return `${start.toLocaleDateString('default', { month: 'short', year: 'numeric' })} - ${end.toLocaleDateString('default', { month: 'short', year: 'numeric' })}`;
    } else {
      return `${start.getFullYear()} - ${end.getFullYear()}`;
    }
  }
  
  updateTimeline() {
    // Trigger timeline recalculation on toggle
    if (!this.includeWeekends) {
      let currentDate = new Date(this.viewStartDate);
      let visibleDays = 0;
      let totalDaysChecked = 0;

      // Check until daysToShow is reached
      while (visibleDays < this.daysToShow) {
          const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
          if (!isWeekend) visibleDays++;
          currentDate.setDate(currentDate.getDate() + 1);
          totalDaysChecked++;
      }

      // Dynamically update daysToShow
      this.daysToShow = totalDaysChecked;
  }

  // Recalculate viewEndDate based on adjusted daysToShow
  this.viewEndDate = new Date(this.viewStartDate);
  this.viewEndDate.setDate(this.viewStartDate.getDate() + this.daysToShow - 1);

  // Update task positions
  this.getTimelineLabelsForDays();
  }
  isFridayWithoutWeekends(date: string): boolean {
    const day = new Date(date).getDay();
    return day === 5 && !this.includeWeekends;
  }
  
  getTimelineLabelsForDays(): { date: string; isSaturday: boolean; isWeekend: boolean }[] {
    const labels = [];
    let currentDate = new Date(this.viewStartDate);
    let addedDays = 0;
  
    // Loop until we've added exactly daysToShow days
    while (addedDays < this.daysToShow) {
      const dayOfWeek = currentDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  
      // Only add days based on weekend toggle
      if (this.includeWeekends || !isWeekend) {
        labels.push({
          date: currentDate.toISOString().split('T')[0],
          isSaturday: dayOfWeek === 6,
          isWeekend: isWeekend
        });
        addedDays++; // Increase counter only if the day is added
      }
  
      currentDate.setDate(currentDate.getDate() + 1);
    }
  
    return labels;
  }
  
  
  
  getTimelineLabelsForMonths(): { date: string }[] {
    const labels = [];
    let currentDate = new Date(this.viewStartDate);
    for (let i = 0; i < this.monthsToShow; i++) {
      labels.push({ date: currentDate.toLocaleDateString('default', { month: 'short', year: 'numeric' }) });
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    return labels;
  }
  
  getTimelineLabelsForYears(): { date: string }[] {
    const labels = [];
    let currentDate = new Date(this.viewStartDate);
    for (let i = 0; i < this.yearsToShow; i++) {
      labels.push({ date: currentDate.getFullYear().toString() });
      currentDate.setFullYear(currentDate.getFullYear() + 1);
      
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

  isWeekend(date: string): boolean {
    const day = new Date(date).getDay();
    return day === 0 || day === 6;
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
  getTaskPositionForDays(task: Task): { left: number, width: number, hidden: boolean } {
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);
    const viewStart = new Date(this.viewStartDate);
    let left = 0;
    let width = 0;
    let hidden = false;
  
    // ✅ Step 1: Hide non-buffer tasks that fall entirely on weekends (if weekends not included)
    if (!this.includeWeekends && task.type !== 'Buffer') {
      let currentDate = new Date(taskStart);
      let isWeekendTask = true;
  
      while (currentDate <= taskEnd) {
        const day = currentDate.getDay();
        if (day !== 0 && day !== 6) {
          isWeekendTask = false;
          break;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
  
      if (isWeekendTask) {
        return { left: 0, width: 0, hidden: true };
      }
    }
  
    // ✅ Step 2: Adjust effective start based on view start
    const effectiveStart = new Date(Math.max(taskStart.getTime(), viewStart.getTime()));
  
    if (this.viewMode === 'Day') {
      let adjustedStart = new Date(viewStart);
      let startDiff = 0;
  
      // ✅ Step 3: Calculate left offset, skipping weekends if necessary
      while (adjustedStart < effectiveStart) {
        const isWeekend = adjustedStart.getDay() === 0 || adjustedStart.getDay() === 6;
        if (this.includeWeekends || !isWeekend) {
          startDiff++;
        }
        adjustedStart.setDate(adjustedStart.getDate() + 1);
      }
  
      left = startDiff * this.dayWidth;
  
      // ✅ Step 4: Calculate duration including buffer (and weekends for buffer tasks)
      let effectiveEnd = new Date(Math.min(taskEnd.getTime(), this.viewEndDate.getTime()));
  
      // 🌟 Extend effectiveEnd with buffer days if it's a Buffer task
      if (task.type === 'Buffer' && task.buffer) {
        const bufferDays = task.buffer;
        const bufferEnd = new Date(effectiveEnd);
        bufferEnd.setDate(bufferEnd.getDate() + bufferDays);
        effectiveEnd = bufferEnd;
      }
  
      // ✅ Step 5: Calculate width considering includeWeekends flag
      let duration = 0;
      let currentDate = new Date(effectiveStart);
  
      while (currentDate <= effectiveEnd) {
        const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
        if (this.includeWeekends || !isWeekend) {
          duration++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
  
      width = Math.max(this.dayWidth / 2, duration * this.dayWidth);
    }
  
    return { left, width, hidden };
  }
  



getTaskPositionForMonth(task: Task): { left: number, width: number, hidden: boolean } {
  const taskStart = new Date(task.startDate);
  const taskEnd = new Date(task.endDate);
  const viewStart = new Date(this.viewStartDate);
  const viewEnd = new Date(this.viewEndDate);
  let left = 0;
  let width = 0;
  let hidden = false;

  // Step 1: Check if task is out of view
  if (taskEnd < viewStart || taskStart > viewEnd) {
      hidden = true;
      return { left, width, hidden };
  }

  // Step 2: Calculate position and width for month view
  const taskStartMonth = taskStart.getMonth() + taskStart.getFullYear() * 12;
  const taskEndMonth = taskEnd.getMonth() + taskEnd.getFullYear() * 12;
  const viewStartMonth = viewStart.getMonth() + viewStart.getFullYear() * 12;
  const viewEndMonth = viewEnd.getMonth() + viewEnd.getFullYear() * 12;

  // Calculate left position
  left = Math.max(0, (taskStartMonth - viewStartMonth) * this.monthWidth);

  // Calculate width
  const visibleMonths = Math.min(taskEndMonth, viewEndMonth) - taskStartMonth + 1;
  width = Math.max(this.monthWidth / 2, visibleMonths * this.monthWidth);

  return { left, width, hidden };
}
getTaskPositionForYear(task: Task): { left: number, width: number, hidden: boolean } {
  const taskStart = new Date(task.startDate);
  const taskEnd = new Date(task.endDate);
  const viewStart = new Date(this.viewStartDate);
  const viewEnd = new Date(this.viewEndDate);
  let left = 0;
  let width = 0;
  let hidden = false;
  if (taskEnd < viewStart || taskStart > viewEnd) {
    hidden = true;
    return { left, width, hidden };
  }

  const taskStartYear = taskStart.getFullYear();
  const taskEndYear = taskEnd.getFullYear();
  const viewStartYear = viewStart.getFullYear();
  const viewEndYear = viewEnd.getFullYear();

  const effectiveStartYear = Math.max(taskStartYear, viewStartYear);
  const effectiveEndYear = Math.min(taskEndYear, viewEndYear);

  left = Math.max(0, (effectiveStartYear - viewStartYear) * this.yearWidth);
  const visibleYears = effectiveEndYear - effectiveStartYear + 1;
  width = Math.max(this.yearWidth / 2, visibleYears * this.yearWidth);

  return { left, width, hidden };
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
  getTimelineGridLines() {
    // Light grey line for visual separation
    return "linear-gradient(to right, lightgrey 1px, transparent 1px)";
  }
  
  getGridLineSize() {
    if (this.viewMode === 'Day') {
      return `${this.dayWidth}px`; // One line per day
    } else if (this.viewMode === 'Month') {
      return `${this.monthWidth}px`; // One line per month
    } else if (this.viewMode === 'Year') {
      return `${this.yearWidth}px`; // One line per year
    }
    return '1px'; // Fallback
  }

  openModal() {
    this.isEditMode = false;  // Set edit mode to false
    this.newTask = {  // Reset the task to default
      id: null,
      name: '',
      assignedTo: '',
      type: 'To-Do',
      startDate: '',
      endDate: '',
      buffer: 0
    };
    this.isModalOpen = true;
  }
  openModalWithTask(task: Task) {
    this.isEditMode = true;  // Set edit mode to true
    this.newTask = { ...task };  // Copy the task to newTask for editing
    this.isModalOpen = true;
  }
  saveTask() {
    if (this.isEditMode) {
      // If in edit mode, update the existing task
      const index = this.tasks.findIndex(task => task.id === this.newTask.id);
      if (index !== -1) {
        this.tasks[index] = { ...this.newTask };
      }
    } else {
      // If in add mode, add the new task
      this.newTask.id = Date.now();  // Assign a new ID
      this.tasks.push({ ...this.newTask });
    }

    // Save tasks to localStorage or backend
    localStorage.setItem("chart_item", JSON.stringify(this.tasks));
    
    // Close modal after saving
    this.closeModal();
  }
  // openEditModal(task: Task) {
  //   this.isModalOpen = true;
  //   this.isEditMode = true;
  //   this.newTask = { ...task }; // clone the task into newTask
  // }
    
  
  closeModal() {
    this.isModalOpen = false;
    this.newTask = {
      id: null,
      name: '',
      assignedTo: '',
      type: 'To-Do',
      startDate: '',
      endDate: '',
      buffer: 0
    };
  }
  
  
  getYearLinePosition(label: { date: string }): number {
    const index = this.getTimelineLabelsForYears().findIndex(l => l.date === label.date);
    return index * this.yearWidth; // Assuming yearWidth is defined for spacing
  }
  getMonthLinePosition(label: { date: string }): number {
    const index = this.getTimelineLabelsForMonths().findIndex(l => l.date === label.date);
    return index * this.monthWidth; // Assuming monthWidth is defined for spacing
  }
  isLastColumn(task: Task): boolean {
    const taskEnd = new Date(task.endDate);
    const viewEnd = new Date(this.viewEndDate);
    return taskEnd.getTime() >= viewEnd.getTime();
  }
  openTaskModal(task: Task) {
    this.selectedTask = { ...task };
  }
  updateTask(updatedTask: Task) {
    console.log("🛠 Updating Task:", updatedTask); // Log the task received
  
    const index = this.tasks.findIndex(task => task.id === updatedTask.id);
  
    if (index !== -1) {
      console.log("✅ Task found at index:", index);
  
      // Ensure buffer value is included if task type is "Buffer"
      if (updatedTask.type === "Buffer" && updatedTask.buffer === undefined) {
        console.warn("⚠️ Buffer task missing buffer value. Setting default value (0).");
        updatedTask.buffer = 0; // Default buffer value if missing
      }
  
      this.tasks[index] = { ...updatedTask }; // Update task in the array
      console.log("📌 Updated Task List:", this.tasks);
  
      localStorage.setItem("chart_item", JSON.stringify(this.tasks)); // Update local storage
      console.log("💾 Local Storage Updated!");
    } else {
      console.warn("⚠️ Task Not Found! Something went wrong.");
    }
  
    this.selectedTask = null; // Close the modal
    console.log("📌 Modal Closed");
  }
  
  
  deleteTask() {
    if (this.newTask.id !== null) {
      // Remove the task from the tasks array
      this.tasks = this.tasks.filter(task => task.id !== this.newTask.id);
      // Update localStorage
      localStorage.setItem("chart_item", JSON.stringify(this.tasks));
    }
    
    // Close modal after deletion
    this.closeModal();
  }
  openModalWithDate(date: string) {
    const formattedDate = new Date(date).toISOString().split('T')[0]; // Ensures date format is YYYY-MM-DD
    this.isModalOpen = true;
    this.taskBeingEdited = null;
    this.newTask = {
      id: Date.now(),
      name: '',
      assignedTo: '',
      type: 'To-Do',
      startDate: formattedDate,
      endDate: formattedDate,
      buffer: 0
    };
  }
  
}

// Helper function for leap year calculation
function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}
  // Navigation for day view

