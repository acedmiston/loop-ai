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
    <div className="p-6 text-white bg-zinc-900 rounded-xl">
      {/* Custom Header */}
      <div className="flex items-center">
        <button
          className={`px-6 py-2 rounded-t-lg font-semibold text-lg transition-colors
            ${
              activeTab === 'start'
                ? 'bg-violet-600 text-white'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }
          `}
          onClick={() => setActiveTab('start')}
          type="button"
        >
          START
        </button>
        {hasEnd ? (
          <button
            className={`ml-2 px-6 py-2 rounded-t-lg font-semibold text-lg transition-colors flex items-center
              ${
                activeTab === 'end'
                  ? 'bg-violet-600 text-white'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }
            `}
            onClick={() => setActiveTab('end')}
            type="button"
          >
            END
            <span
              className="ml-2 text-xl cursor-pointer text-zinc-400 hover:text-red-400"
              onClick={e => {
                e.stopPropagation();
                setHasEnd(false);
                onEndDateChange(null);
                setActiveTab('start');
              }}
            >
              ×
            </span>
          </button>
        ) : (
          <button
            className="px-6 py-2 ml-2 text-lg font-semibold transition-colors rounded-t-lg bg-zinc-800 text-violet-400 hover:bg-zinc-700"
            onClick={() => {
              setHasEnd(true);
              setActiveTab('end');
            }}
            type="button"
          >
            +END
          </button>
        )}
      </div>
      <div>
        {/* Calendar */}
        <div>
          <DatePicker
            selected={startDate}
            onChange={date => onStartDateChange(date as Date | null)}
            inline
            calendarClassName="!w-[400px] !h-[400px] !text-lg !bg-zinc-900 !text-white !rounded-lg !border-zinc-700"
            wrapperClassName="!w-[400px] !h-[400px]"
          />
        </div>
        {/* Time scrolls */}
        <div className="flex gap-6-mt-2">
          {/* Start time scroll */}
          <div>
            <div className="mb-2 text-xs font-semibold text-center text-zinc-400">Start Time</div>
            <div className="w-24 h-64 overflow-y-scroll border rounded-lg bg-zinc-800">
              {timeOptions.map((t, i) => (
                <div
                  key={i}
                  className={`px-2 py-2 text-center cursor-pointer rounded transition-colors
                    ${
                      startDate &&
                      startDate.getHours() === t.getHours() &&
                      startDate.getMinutes() === t.getMinutes()
                        ? 'bg-violet-600 text-white font-bold'
                        : 'hover:bg-zinc-700 text-zinc-200'
                    }
                  `}
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
              <div className="mb-2 text-xs font-semibold text-center text-zinc-400">End Time</div>
              <div className="w-24 h-64 overflow-y-scroll border rounded-lg bg-zinc-800">
                {timeOptions.map((t, i) => (
                  <div
                    key={i}
                    className={`px-2 py-2 text-center cursor-pointer rounded transition-colors
                      ${
                        endDate &&
                        endDate.getHours() === t.getHours() &&
                        endDate.getMinutes() === t.getMinutes()
                          ? 'bg-violet-600 text-white font-bold'
                          : 'hover:bg-zinc-700 text-zinc-200'
                      }
                    `}
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
