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
  const getTimeOptions = () => {
    const times: Date[] = [];
    const base = startDate || new Date();
    const d = new Date(base);
    d.setHours(0, 0, 0, 0);
    for (let i = 0; i < 24 * 4; i++) {
      times.push(new Date(d));
      d.setMinutes(d.getMinutes() + 15);
    }
    return times;
  };

  const timeOptions = getTimeOptions();

  // Scroll to the first available (not in the past) time for today, or to noon if not today
  useEffect(() => {
    // Find the index of the first available (not in the past) time for today, otherwise default to noon
    let scrollIndex = timeOptions.findIndex(t => {
      if (startDate && startDate.toDateString() === new Date().toDateString()) {
        return (
          t.getHours() > new Date().getHours() ||
          (t.getHours() === new Date().getHours() && t.getMinutes() > new Date().getMinutes())
        );
      }
      // If not today, scroll to noon
      return t.getHours() === 12 && t.getMinutes() === 0;
    });
    if (scrollIndex === -1) {
      scrollIndex = timeOptions.findIndex(t => t.getHours() === 12 && t.getMinutes() === 0);
    }
    // Scroll start time
    if (startTimeScrollRef.current && scrollIndex !== -1) {
      const itemHeight = startTimeScrollRef.current.scrollHeight / timeOptions.length;
      startTimeScrollRef.current.scrollTop = itemHeight * scrollIndex;
    }
    // Scroll end time (if enabled)
    if (hasEnd && endTimeScrollRef.current && scrollIndex !== -1) {
      const itemHeight = endTimeScrollRef.current.scrollHeight / timeOptions.length;
      endTimeScrollRef.current.scrollTop = itemHeight * scrollIndex;
    }
  }, [hasEnd, timeOptions.length, startDate]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        ref={modalRef}
        className="relative flex flex-col items-center w-full max-w-xl p-6 bg-white shadow-xl rounded-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            <button
              className={`px-3 py-1 rounded-t-md font-medium ${activeTab === 'start' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}
              onClick={() => setActiveTab('start')}
              type="button"
            >
              Start
            </button>
            {hasEnd ? (
              <button
                className={`ml-2 px-3 py-1 rounded-t-md font-medium ${activeTab === 'end' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}
                onClick={e => {
                  if (activeTab === 'end') {
                    e.stopPropagation();
                    setHasEnd(false);
                    setEndDate(null);
                    setActiveTab('start');
                  } else {
                    setActiveTab('end');
                  }
                }}
                type="button"
              >
                {activeTab === 'end' ? (
                  <span className="text-md" title="Remove end time">
                    × End
                  </span>
                ) : (
                  '+ End'
                )}
              </button>
            ) : (
              <button
                className="px-3 py-1 ml-2 font-medium text-blue-500 bg-gray-100 rounded-t-md hover:bg-blue-50"
                onClick={() => {
                  setHasEnd(true);
                  setActiveTab('end');
                }}
                type="button"
              >
                + End
              </button>
            )}
          </div>
          <button
            className="text-2xl font-bold text-gray-400 hover:text-gray-700 mt-[-25]"
            onClick={onClose}
            aria-label="Close"
            type="button"
          >
            ×
          </button>
        </div>
        <div className="flex w-full max-w-full gap-4">
          {/* Calendar */}
          <div className="flex-shrink-0 h-64" style={{ minWidth: 288 }}>
            <DatePicker
              selected={startDate}
              onChange={date => setStartDate(date as Date | null)}
              minDate={new Date()}
              inline
              calendarClassName="!w-full !h-full !rounded-lg"
              wrapperClassName="!w-[400px] !h-[400px] focus:ring-0 focus:outline-none focus:border-blue-500"
            />
          </div>
          {/* Time scrolls */}
          <div className="flex max-w-full gap-3 -mt-5 overflow-x-auto">
            {/* Start time scroll */}
            <div style={{ minWidth: 96 }}>
              <div className="mb-1 text-xs font-medium text-center text-gray-500">Start Time</div>
              <div
                className="w-24 h-64 overflow-y-scroll bg-white border rounded-md"
                ref={startTimeScrollRef}
              >
                {timeOptions.map((t, i) => {
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
                      className={`px-2 py-1 text-center cursor-pointer ${
                        isPast
                          ? 'text-gray-300 cursor-not-allowed bg-gray-50'
                          : startDate &&
                              startDate.getHours() === t.getHours() &&
                              startDate.getMinutes() === t.getMinutes()
                            ? 'bg-blue-100 text-blue-700 font-semibold'
                            : 'hover:bg-gray-100'
                      }`}
                      onClick={() => {
                        if (!isPast) {
                          if (startDate) setStartDate(setTimeOnDate(startDate, t));
                          else setStartDate(t);
                        }
                      }}
                      aria-disabled={isPast}
                    >
                      {t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  );
                })}
              </div>
            </div>
            {/* End time scroll (if enabled) */}
            {hasEnd && (
              <div style={{ minWidth: 96 }}>
                <div className="mb-1 text-xs font-medium text-center text-gray-500">End Time</div>
                <div
                  className="w-24 h-64 overflow-y-scroll bg-white border rounded-md"
                  ref={endTimeScrollRef}
                >
                  {timeOptions.map((t, i) => {
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
                      // If no endDate is set, block times before the startDate
                      if (startDate) {
                        return t.getTime() <= startDate.getTime();
                      }
                      return false;
                    })();
                    return (
                      <div
                        key={i}
                        className={`px-2 py-1 text-center cursor-pointer ${
                          isPast
                            ? 'text-gray-300 cursor-not-allowed bg-gray-50'
                            : endDate &&
                                endDate.getHours() === t.getHours() &&
                                endDate.getMinutes() === t.getMinutes()
                              ? 'bg-blue-100 text-blue-700 font-semibold'
                              : 'hover:bg-gray-100'
                        }`}
                        onClick={() => {
                          if (!isPast) {
                            if (startDate && endDate) setEndDate(setTimeOnDate(endDate, t));
                            else if (startDate) setEndDate(setTimeOnDate(startDate, t));
                            else setEndDate(t);
                          }
                        }}
                        aria-disabled={isPast}
                      >
                        {t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
