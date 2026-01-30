import React, { useState, useRef, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useClickOutside } from '@/lib/useClickOutside';

interface EventDateTimeModalProps {
  initialStartDate?: Date | null;
  initialEndDate?: Date | null;
  initialHasEnd?: boolean;
  onClose: () => void;
  onSave: (start: Date | null, end: Date | null, hasEnd: boolean) => void;
}

const EventDateTimeModal: React.FC<EventDateTimeModalProps> = ({
  initialStartDate = null,
  initialEndDate = null,
  initialHasEnd = false,
  onClose,
  onSave,
}) => {
  // Helper to get today at 12:00pm
  const getDefaultNoon = () => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  };

  const [startDate, setStartDate] = useState<Date | null>(
    initialStartDate !== null && initialStartDate !== undefined
      ? initialStartDate
      : getDefaultNoon()
  );
  const [endDate, setEndDate] = useState<Date | null>(
    initialEndDate !== null && initialEndDate !== undefined && initialHasEnd ? initialEndDate : null
  );
  const [hasEnd, setHasEnd] = useState(initialHasEnd);
  const [activeTab, setActiveTab] = useState<'start' | 'end'>(initialHasEnd ? 'end' : 'start');

  // Initialize endDate from startDate when end tab is activated
  useEffect(() => {
    if (hasEnd && !endDate && startDate) {
      const newEndDate = new Date(startDate);
      // Set end time to 1 hour after start time, or keep same time if start is later in day
      newEndDate.setHours(startDate.getHours() + 1, startDate.getMinutes(), 0, 0);
      setEndDate(newEndDate);
    }
  }, [hasEnd, endDate, startDate]);

  const startTimeScrollRef = useRef<HTMLDivElement>(null);
  const endTimeScrollRef = useRef<HTMLDivElement>(null);

  // Close modal when clicking outside
  const modalRef = useRef<HTMLDivElement>(null);
  useClickOutside(modalRef, onClose);

  // Helper to get a date with the same day as startDate but a new time
  const setTimeOnDate = (base: Date, time: Date) => {
    const d = new Date(base);
    d.setHours(time.getHours(), time.getMinutes(), 0, 0);
    return d;
  };

  // All times for the scroll (every 15 min)
  const getTimeOptions = (forEnd: boolean = false) => {
    const times: Date[] = [];
    // For end time, use endDate if available, otherwise startDate
    const base = forEnd ? (endDate || startDate || new Date()) : (startDate || new Date());
    const d = new Date(base);
    d.setHours(0, 0, 0, 0);
    for (let i = 0; i < 24 * 4; i++) {
      times.push(new Date(d));
      d.setMinutes(d.getMinutes() + 15);
    }
    return times;
  };

  const startTimeOptions = getTimeOptions(false);
  const endTimeOptions = getTimeOptions(true);

  // Helper to format date in Partiful style: "Sat, Jan 24th"
  const formatDateCompact = (date: Date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = date.getDate();
    const ordinal = (n: number) => {
      if (n > 3 && n < 21) return 'th';
      switch (n % 10) {
        case 1:
          return 'st';
        case 2:
          return 'nd';
        case 3:
          return 'rd';
        default:
          return 'th';
      }
    };
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${day}${ordinal(day)}`;
  };

  // Helper to format time: "6:00pm"
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
  };

  // Helper to format full summary: "Sat, Jan 24 · 6:00pm — Thu, Feb 12 · 9:00pm"
  const formatSummary = () => {
    if (!startDate) return '';
    const startStr = `${formatDateCompact(startDate)} · ${formatTime(startDate)}`;
    if (hasEnd && endDate) {
      const endStr = `${formatDateCompact(endDate)} · ${formatTime(endDate)}`;
      return `${startStr} — ${endStr}`;
    }
    return startStr;
  };

  // Scroll to the first available (not in the past) time for today, or to noon if not today
  useEffect(() => {
    // Find the index of the first available (not in the past) time for today, otherwise default to noon
    let startScrollIndex = startTimeOptions.findIndex(t => {
      if (startDate && startDate.toDateString() === new Date().toDateString()) {
        return (
          t.getHours() > new Date().getHours() ||
          (t.getHours() === new Date().getHours() && t.getMinutes() > new Date().getMinutes())
        );
      }
      // If not today, scroll to noon
      return t.getHours() === 12 && t.getMinutes() === 0;
    });
    if (startScrollIndex === -1) {
      startScrollIndex = startTimeOptions.findIndex(t => t.getHours() === 12 && t.getMinutes() === 0);
    }
    // Scroll start time
    if (startTimeScrollRef.current && startScrollIndex !== -1) {
      const itemHeight = startTimeScrollRef.current.scrollHeight / startTimeOptions.length;
      startTimeScrollRef.current.scrollTop = itemHeight * startScrollIndex;
    }
    
    // Scroll end time (if enabled)
    if (hasEnd && endTimeScrollRef.current) {
      const endTimeDate = endDate || startDate;
      let endScrollIndex = endTimeOptions.findIndex(t => {
        if (endTimeDate && endTimeDate.toDateString() === new Date().toDateString()) {
          return (
            t.getHours() > new Date().getHours() ||
            (t.getHours() === new Date().getHours() && t.getMinutes() > new Date().getMinutes())
          );
        }
        // If not today, scroll to noon or to start time if same day
        if (endTimeDate && endTimeDate.toDateString() === startDate?.toDateString() && startDate) {
          return (
            t.getHours() > startDate.getHours() ||
            (t.getHours() === startDate.getHours() && t.getMinutes() > startDate.getMinutes())
          );
        }
        return t.getHours() === 12 && t.getMinutes() === 0;
      });
      if (endScrollIndex === -1) {
        endScrollIndex = endTimeOptions.findIndex(t => t.getHours() === 12 && t.getMinutes() === 0);
      }
      if (endScrollIndex !== -1) {
        const itemHeight = endTimeScrollRef.current.scrollHeight / endTimeOptions.length;
        endTimeScrollRef.current.scrollTop = itemHeight * endScrollIndex;
      }
    }
  }, [hasEnd, startTimeOptions.length, endTimeOptions.length, startDate, endDate]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        ref={modalRef}
        className="relative flex flex-col w-full max-w-4xl p-6 bg-white shadow-xl rounded-2xl"
      >
        {/* Summary Display */}
        {startDate && (
          <div className="mb-4 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg">
            {formatSummary()}
          </div>
        )}

        {/* Start/End Date/Time Inputs */}
        <div className="flex items-center gap-3 mb-4">
          {/* Start Date/Time Input */}
          <button
            type="button"
            onClick={() => setActiveTab('start')}
            className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
              activeTab === 'start'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="text-xs text-gray-500 mb-1">Start</div>
            {startDate ? (
              <div className="text-sm font-medium text-gray-900">
                {formatDateCompact(startDate)} {formatTime(startDate)}
              </div>
            ) : (
              <div className="text-sm text-gray-400">Select start date</div>
            )}
          </button>

          {/* Arrow Separator */}
          <div className="text-gray-400">→</div>

          {/* End Date/Time Input */}
          {hasEnd ? (
            <button
              type="button"
              onClick={() => setActiveTab('end')}
              className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all relative ${
                activeTab === 'end'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div
                onClick={e => {
                  e.stopPropagation();
                  setHasEnd(false);
                  setEndDate(null);
                  setActiveTab('start');
                }}
                className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 text-xs cursor-pointer"
                title="Remove end date"
                role="button"
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    setHasEnd(false);
                    setEndDate(null);
                    setActiveTab('start');
                  }
                }}
              >
                ×
              </div>
              <div className="text-xs text-gray-500 mb-1">End</div>
              {endDate ? (
                <div className="text-sm font-medium text-gray-900">
                  {formatDateCompact(endDate)} {formatTime(endDate)}
                </div>
              ) : (
                <div className="text-sm text-gray-400">Select end date</div>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setHasEnd(true);
                if (!endDate && startDate) {
                  const newEndDate = new Date(startDate);
                  newEndDate.setHours(startDate.getHours() + 1, startDate.getMinutes(), 0, 0);
                  setEndDate(newEndDate);
                }
                setActiveTab('end');
              }}
              className="flex-1 px-4 py-3 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100 transition-all"
            >
              <div className="text-xs text-gray-500 mb-1">End</div>
              <div className="text-sm text-gray-400">Optional</div>
            </button>
          )}
        </div>

        {/* Close Button */}
        <button
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          onClick={onClose}
          aria-label="Close"
          type="button"
        >
          ×
        </button>
        <div className="flex w-full gap-6">
          {/* Calendar */}
          <div className="flex-shrink-0" style={{ minWidth: 320 }}>
            <DatePicker
              selected={activeTab === 'end' ? endDate : startDate}
              onChange={date => {
                if (activeTab === 'end') {
                  if (date && startDate && date < startDate) {
                    // Don't allow end date before start date
                    return;
                  }
                  // Preserve end time when changing end date (same as start-date branch does for end date)
                  if (date && endDate) {
                    const preserved = new Date(date);
                    preserved.setHours(endDate.getHours(), endDate.getMinutes(), 0, 0);
                    setEndDate(preserved);
                  } else {
                    setEndDate(date as Date | null);
                  }
                } else {
                  setStartDate(date as Date | null);
                  // If end date exists and new start date is after end date, update end date
                  if (date && endDate && date > endDate) {
                    const newEndDate = new Date(date);
                    newEndDate.setHours(endDate.getHours(), endDate.getMinutes(), 0, 0);
                    setEndDate(newEndDate);
                  }
                }
              }}
              minDate={activeTab === 'end' && startDate ? startDate : new Date()}
              inline
              calendarClassName="!w-full !h-full !rounded-lg"
              wrapperClassName="!w-full focus:ring-0 focus:outline-none"
            />
          </div>
          {/* Time scrolls */}
          <div className="flex gap-4 flex-1">
            {/* Start time scroll */}
            <div className="flex-1 min-w-[120px]">
              <div className="mb-2 text-xs font-medium text-gray-700">Start Time</div>
              <div
                className="w-full h-64 overflow-y-scroll bg-white border rounded-lg"
                ref={startTimeScrollRef}
              >
                {startTimeOptions.map((t, i) => {
                  const isPast = (() => {
                    if (startDate) {
                      // If the selected date is today, block times in the past
                      if (startDate.toDateString() === new Date().toDateString()) {
                        return (
                          t.getHours() < new Date().getHours() ||
                          (t.getHours() === new Date().getHours() &&
                            t.getMinutes() <= new Date().getMinutes())
                        );
                      }
                      // If the selected date is not today, block times before the selected start time
                      if (endDate && endDate.toDateString() === startDate.toDateString()) {
                        return t.getTime() <= startDate.getTime();
                      }
                    }
                    return false;
                  })();
                  return (
                    <div
                      key={i}
                      className={`px-3 py-2 text-center cursor-pointer transition-colors ${
                        isPast
                          ? 'text-gray-300 cursor-not-allowed bg-gray-50'
                          : startDate &&
                              startDate.getHours() === t.getHours() &&
                              startDate.getMinutes() === t.getMinutes()
                            ? 'bg-blue-600 text-white font-semibold'
                            : 'hover:bg-gray-100 text-gray-700'
                      }`}
                      onClick={() => {
                        if (!isPast) {
                          if (startDate) setStartDate(setTimeOnDate(startDate, t));
                          else setStartDate(t);
                        }
                      }}
                      aria-disabled={isPast}
                    >
                      {formatTime(t)}
                    </div>
                  );
                })}
              </div>
            </div>
            {/* End time scroll - always show when hasEnd is true */}
            {hasEnd && (
              <div className="flex-1 min-w-[120px]">
                <div className="mb-2 text-xs font-medium text-gray-700">End Time</div>
                <div
                  className="w-full h-64 overflow-y-scroll bg-white border rounded-lg"
                  ref={endTimeScrollRef}
                >
                  {endTimeOptions.map((t, i) => {
                    const isPast = (() => {
                      if (!startDate) return false;
                      
                      // Get the date for the end time (could be different day)
                      const endTimeDate = endDate || startDate;
                      
                      // If end date is today, block times in the past
                      if (endTimeDate.toDateString() === new Date().toDateString()) {
                        const now = new Date();
                        const timeToCheck = new Date(endTimeDate);
                        timeToCheck.setHours(t.getHours(), t.getMinutes(), 0, 0);
                        return timeToCheck <= now;
                      }
                      
                      // If end date is same as start date, block times before start time
                      if (endTimeDate.toDateString() === startDate.toDateString()) {
                        const timeToCheck = new Date(endTimeDate);
                        timeToCheck.setHours(t.getHours(), t.getMinutes(), 0, 0);
                        return timeToCheck <= startDate;
                      }
                      
                      // If end date is different from start date, allow any time on that day
                      // (validation already handled by minDate on calendar)
                      return false;
                    })();
                    return (
                      <div
                        key={i}
                        className={`px-3 py-2 text-center cursor-pointer transition-colors ${
                          isPast
                            ? 'text-gray-300 cursor-not-allowed bg-gray-50'
                            : endDate &&
                                endDate.getHours() === t.getHours() &&
                                endDate.getMinutes() === t.getMinutes()
                              ? 'bg-blue-600 text-white font-semibold'
                              : 'hover:bg-gray-100 text-gray-700'
                        }`}
                        onClick={() => {
                          if (!isPast) {
                            // Preserve the end date's day, just update the time
                            if (endDate) {
                              setEndDate(setTimeOnDate(endDate, t));
                            } else if (startDate) {
                              // If no end date, create one from start date
                              const newEndDate = new Date(startDate);
                              newEndDate.setHours(t.getHours(), t.getMinutes(), 0, 0);
                              setEndDate(newEndDate);
                            } else {
                              setEndDate(t);
                            }
                          }
                        }}
                        aria-disabled={isPast}
                      >
                        {formatTime(t)}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end w-full gap-2 mt-6">
          <button
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
            onClick={() => onSave(startDate, endDate, hasEnd)}
            type="button"
            disabled={!startDate}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventDateTimeModal;
