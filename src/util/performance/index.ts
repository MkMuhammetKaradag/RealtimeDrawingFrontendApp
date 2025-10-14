// Performance monitoring utilities

interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage?: number;
}

class PerformanceMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  private fps = 60;
  private frameTime = 16.67; // 60fps = ~16.67ms per frame

  startMonitoring(): void {
    this.measurePerformance();
  }

  private measurePerformance(): void {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    
    this.frameCount++;
    
    if (this.frameCount % 60 === 0) { // Update every 60 frames
      this.fps = Math.round(1000 / deltaTime);
      this.frameTime = deltaTime;
      
      // Log performance warnings
      if (this.fps < 30) {
        console.warn(`Low FPS detected: ${this.fps}fps`);
      }
      
      if (this.frameTime > 33.33) { // More than 30fps threshold
        console.warn(`High frame time: ${this.frameTime.toFixed(2)}ms`);
      }
    }
    
    this.lastTime = currentTime;
    requestAnimationFrame(() => this.measurePerformance());
  }

  getMetrics(): PerformanceMetrics {
    return {
      fps: this.fps,
      frameTime: this.frameTime,
      memoryUsage: this.getMemoryUsage(),
    };
  }

  private getMemoryUsage(): number | undefined {
    // @ts-ignore - memory API is not in all browsers
    if (performance.memory) {
      // @ts-ignore
      return Math.round(performance.memory.usedJSHeapSize / 1048576); // Convert to MB
    }
    return undefined;
  }
}

// Debounce function for performance optimization
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle function for performance optimization
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

export default PerformanceMonitor;
