import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface EventDateTimePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
  hasEnd: boolean;
  setHasEnd: (val: boolean) => void;
}

const EventDateTimePicker: React.FC<EventDateTimePickerProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  hasEnd,
  setHasEnd,
}) => {
  const [activeTab, setActiveTab] = useState<'start' | 'end'>(hasEnd ? 'end' : 'start');

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

  return (
    <div className="w-full">
      {/* Custom Header */}
      <div className="flex items-center mb-2">
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
            onClick={() => setActiveTab('end')}
            type="button"
          >
            End{' '}
            <span
              className="ml-1 text-xs text-gray-400 cursor-pointer"
              onClick={e => {
                e.stopPropagation();
                setHasEnd(false);
                onEndDateChange(null);
                setActiveTab('start');
              }}
            >
              × End
            </span>
          </button>
        ) : (
          <button
            className="ml-2 px-3 py-1 rounded-t-md font-medium bg-gray-100 text-blue-500 hover:bg-blue-50"
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
      <div className="flex gap-6">
        {/* Calendar */}
        <div>
          <DatePicker
            selected={startDate}
            onChange={date => onStartDateChange(date as Date | null)}
            inline
            calendarClassName="!w-72"
          />
        </div>
        {/* Time scrolls */}
        <div className="flex gap-4">
          {/* Start time scroll */}
          <div>
            <div className="text-xs font-medium text-gray-500 mb-1 text-center">Start Time</div>
            <div className="h-64 overflow-y-scroll border rounded-md bg-white w-24">
              {timeOptions.map((t, i) => (
                <div
                  key={i}
                  className={`px-2 py-1 text-center cursor-pointer ${
                    startDate &&
                    startDate.getHours() === t.getHours() &&
                    startDate.getMinutes() === t.getMinutes()
                      ? 'bg-blue-100 text-blue-700 font-semibold'
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => {
                    if (startDate) onStartDateChange(setTimeOnDate(startDate, t));
                    else onStartDateChange(t);
                  }}
                >
                  {t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              ))}
            </div>
          </div>
          {/* End time scroll (if enabled) */}
          {hasEnd && (
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1 text-center">End Time</div>
              <div className="h-64 overflow-y-scroll border rounded-md bg-white w-24">
                {timeOptions.map((t, i) => (
                  <div
                    key={i}
                    className={`px-2 py-1 text-center cursor-pointer ${
                      endDate &&
                      endDate.getHours() === t.getHours() &&
                      endDate.getMinutes() === t.getMinutes()
                        ? 'bg-blue-100 text-blue-700 font-semibold'
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => {
                      if (startDate && endDate) onEndDateChange(setTimeOnDate(endDate, t));
                      else if (startDate) onEndDateChange(setTimeOnDate(startDate, t));
                      else onEndDateChange(t);
                    }}
                  >
                    {t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDateTimePicker;
