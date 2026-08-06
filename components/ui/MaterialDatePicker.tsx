import React, { useState, useRef, useEffect } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays } from "date-fns";
import { Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const PRIMARY = undefined; // not used anymore
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export interface MaterialDatePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  onCancel?: () => void;
  className?: string;
  dateFormat?: string;
  placeholder?: string;
}

export function MaterialDatePicker({
  value,
  onChange,
  onCancel,
  className,
  dateFormat = "PPP",
  placeholder = "Select date",
}: MaterialDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [tempDate, setTempDate] = useState<Date | undefined>(value);
  const [month, setMonth] = useState<Date>(value ? startOfMonth(value) : startOfMonth(new Date()));
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  // Month/year dropdown logic
  const years = Array.from({ length: 31 }, (_, i) => 2000 + i);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Calendar grid logic
  function getCalendarGrid(month: Date) {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
    const days = [];
    let day = start;
    while (day <= end) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }
  const days = getCalendarGrid(month);

  // Handlers
  function handleMonthChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newMonth = new Date(month);
    newMonth.setMonth(Number(e.target.value));
    setMonth(startOfMonth(newMonth));
  }
  function handleYearChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newMonth = new Date(month);
    newMonth.setFullYear(Number(e.target.value));
    setMonth(startOfMonth(newMonth));
  }
  function handlePrevMonth() {
    setMonth(subMonths(month, 1));
  }
  function handleNextMonth() {
    setMonth(addMonths(month, 1));
  }
  function handleDayClick(day: Date) {
    setTempDate(day);
  }
  function handleCancel() {
    setTempDate(value);
    setOpen(false);
    onCancel?.();
  }
  function handleOk() {
    onChange(tempDate);
    setOpen(false);
  }

  useEffect(() => {
    if (open && cancelBtnRef.current) {
      cancelBtnRef.current.focus();
    }
  }, [open]);

  // Render
  return (
    <>
      <style>{`
        .material-picker select, .material-picker option {
          background: #fff !important;
          color: #444 !important;
        }
        @keyframes material-fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-material-fade-in {
          animation: material-fade-in 0.3s cubic-bezier(0.4,0,0.2,1) forwards;
        }
      `}</style>
      <div className="material-picker">
        <button
          type="button"
          className={cn(
            "flex h-10 w-full items-center rounded-md border border-border bg-card px-3 text-left text-sm text-navy",
            className,
          )}
          onClick={() => setOpen(true)}
        >
          {tempDate ? format(tempDate, dateFormat) : placeholder}
        </button>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-[340px] scale-95 transform rounded-lg border border-border bg-popover opacity-0 shadow-lg transition-all duration-300 animate-material-fade-in">
              {/* Header */}
              <div className="rounded-t-lg bg-navy px-6 pb-3 pt-4 text-navy-foreground">
                <div className="mb-1 text-xs tracking-widest text-navy-foreground/80">SELECT DATE</div>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-semibold text-navy-foreground">{tempDate ? format(tempDate, "EEE, MMM d") : "---"}</div>
                  <Pencil className="h-5 w-5 cursor-pointer text-navy-foreground/80" />
                </div>
              </div>
              {/* Month/Year Dropdown and Navigation */}
              <div className="flex items-center justify-between px-6 pt-4">
                <div className="flex items-center gap-2 relative">
                  <div className="relative">
                    <select
                      value={month.getMonth()}
                      onChange={handleMonthChange}
                      className="cursor-pointer appearance-none border-none bg-none pr-6 text-sm font-medium text-navy focus:outline-none"
                      style={{ padding: 0, minWidth: '120px' }}
                    >
                      {months.map((m, idx) => (
                        <option key={m} value={idx}>{m}</option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 transform text-xs text-muted-foreground">▼</span>
                  </div>
                  <div className="relative">
                    <select
                      value={month.getFullYear()}
                      onChange={handleYearChange}
                      className="cursor-pointer appearance-none border-none bg-none pr-6 text-sm font-medium text-navy focus:outline-none"
                      style={{ padding: 0, minWidth: '90px' }}
                    >
                      {years.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 transform text-xs text-muted-foreground">▼</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={handlePrevMonth} className="rounded border border-transparent p-1 transition-colors hover:border-border">
                    <ChevronLeft className="h-5 w-5 text-navy" />
                  </button>
                  <button type="button" onClick={handleNextMonth} className="rounded border border-transparent p-1 transition-colors hover:border-border">
                    <ChevronRight className="h-5 w-5 text-navy" />
                  </button>
                </div>
              </div>
              {/* Calendar Grid */}
              <div className="px-6 pb-2 pt-2">
                <div className="mb-1 flex justify-between text-xs font-medium text-muted-foreground">
                  {WEEKDAYS.map(d => <div key={d} className="w-9 text-center">{d}</div>)}
                </div>
                <div className="flex flex-wrap">
                  {days.map((day, idx) => {
                    const isToday = isSameDay(day, new Date());
                    const isSelected = tempDate && isSameDay(day, tempDate);
                    const inMonth = isSameMonth(day, month);
                    return (
                      <div
                        key={idx}
                        className="w-9 h-9 flex items-center justify-center mb-1"
                      >
                        <button
                          type="button"
                          className={
                            "w-8 h-8 rounded-full flex items-center justify-center transition-all " +
                            (isSelected
                              ? "bg-navy font-semibold text-navy-foreground"
                              : isToday
                              ? "border-2 border-navy font-semibold text-navy"
                              : inMonth
                              ? "text-navy hover:bg-muted"
                              : "text-muted-foreground/40")
                          }
                          style={{ outline: "none" }}
                          onClick={() => inMonth && handleDayClick(day)}
                          disabled={!inMonth}
                        >
                          {format(day, "d")}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Footer */}
              <div className="flex justify-end items-center gap-4 px-6 pb-4 pt-2">
                <button type="button" ref={cancelBtnRef} onClick={handleCancel} className="rounded px-2 py-1 text-sm font-medium uppercase tracking-wider text-navy hover:bg-muted">Cancel</button>
                <button type="button" onClick={handleOk} className="rounded px-2 py-1 text-sm font-medium uppercase tracking-wider text-navy hover:bg-muted">OK</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
} 