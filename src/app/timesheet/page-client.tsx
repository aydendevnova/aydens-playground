"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  InfoIcon,
  Download,
  Upload,
  TrashIcon,
  DollarSign,
} from "lucide-react";

interface TimeEntry {
  startTime: string;
  endTime: string;
  hours?: number; // Optional direct hours input
}

interface DayEntry {
  date: Date;
  entries: TimeEntry[];
  totalHours: number;
  useDirectHours: boolean; // New flag to toggle between time and direct hours input
}

// Helper to get Monday of a given date
const getMonday = (d: Date): Date => {
  const date = new Date(d);
  const dayOfWeek = date.getDay(); // Sunday - 0, Monday - 1, ..., Saturday - 6
  // Adjust to get Monday. If Sunday (0), subtract 6 days. Otherwise, subtract (dayOfWeek - 1) days.
  const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0); // Normalize to the start of the day
  return date;
};

// Helper to format week range for display
const getWeekRangeDisplay = (monday: Date): string => {
  const startDate = new Date(monday);
  const endDate = new Date(monday);
  endDate.setDate(monday.getDate() + 6); // Sunday of that week

  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
  }; // Removed year for brevity
  return `${startDate.toLocaleDateString("en-US", options)} - ${endDate.toLocaleDateString("en-US", options)}, ${startDate.getFullYear()}`;
};

// Helper for localStorage key
const getLocalStorageKey = (monday: Date): string => {
  return `timesheet-data-${monday.toISOString().split("T")[0]}`;
};

// Add wage to localStorage key prefix for consistency
const TIMESHEET_PREFIX = "timesheet-data-";
const WAGE_KEY = "timesheet-hourly-wage";

// Helper to safely access localStorage
const getLocalStorage = (key: string): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(key);
  }
  return null;
};

const setLocalStorage = (key: string, value: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem(key, value);
  }
};

const removeLocalStorage = (key: string): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(key);
  }
};

export default function TimeSheetClient() {
  const [selectedMonday, setSelectedMonday] = useState<Date>(() =>
    getMonday(new Date()),
  );
  const [weekData, setWeekData] = useState<DayEntry[]>([]);
  const [hourlyWage, setHourlyWage] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize hourly wage from localStorage on mount
  useEffect(() => {
    const savedWage = getLocalStorage(WAGE_KEY);
    if (savedWage) {
      setHourlyWage(parseFloat(savedWage));
    }
  }, []);

  // Effect to load data from localStorage or initialize for the selected week
  useEffect(() => {
    const key = getLocalStorageKey(selectedMonday);
    const storedData = getLocalStorage(key);

    if (storedData) {
      try {
        const parsedData: DayEntry[] = JSON.parse(storedData).map(
          (day: any) => ({
            ...day,
            date: new Date(day.date), // Deserialize date string back to Date object
            entries: day.entries ?? [{ startTime: "", endTime: "" }], // Ensure entries always exist
            totalHours: parseFloat(day.totalHours) ?? 0,
            useDirectHours: day.useDirectHours ?? false,
          }),
        );
        setWeekData(parsedData);
      } catch (error) {
        console.error("Error parsing data from localStorage:", error);
        // Fallback to new week data if parsing fails
        initializeNewWeek(selectedMonday);
      }
    } else {
      initializeNewWeek(selectedMonday);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonday]);

  const initializeNewWeek = (monday: Date) => {
    const newWeekData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return {
        date,
        entries: [{ startTime: "", endTime: "", hours: 0 }],
        totalHours: 0,
        useDirectHours: false,
      };
    });
    setWeekData(newWeekData);
  };

  // Effect to save data to localStorage whenever weekData changes
  useEffect(() => {
    if (weekData && weekData.length > 0) {
      const key = getLocalStorageKey(selectedMonday);
      setLocalStorage(key, JSON.stringify(weekData));
    }
  }, [weekData, selectedMonday]);

  // Save wage to localStorage when it changes
  useEffect(() => {
    setLocalStorage(WAGE_KEY, hourlyWage.toString());
  }, [hourlyWage]);

  const calculateDayHours = (
    entries: TimeEntry[],
    useDirectHours: boolean,
  ): number => {
    if (useDirectHours) {
      return entries.reduce((total, entry) => {
        const hours = entry.hours ?? 0;
        return total + (isNaN(hours) ? 0 : hours);
      }, 0);
    }

    return entries.reduce((total, entry) => {
      if (!entry.startTime || !entry.endTime) {
        return total;
      }

      const startParts = entry.startTime.split(":");
      const endParts = entry.endTime.split(":");

      if (startParts.length !== 2 || endParts.length !== 2) {
        return total; // Malformed time string
      }

      // After length check, elements are guaranteed to be strings
      const startHour = parseInt(startParts[0]!, 10);
      const startMin = parseInt(startParts[1]!, 10);
      const endHour = parseInt(endParts[0]!, 10);
      const endMin = parseInt(endParts[1]!, 10);

      if (
        isNaN(startHour) ||
        isNaN(startMin) ||
        isNaN(endHour) ||
        isNaN(endMin)
      ) {
        return total; // Parts are not numbers
      }

      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (endMinutes < startMinutes) {
        return total;
      }

      return total + (endMinutes - startMinutes) / 60;
    }, 0);
  };

  const handleTimeChange = (
    dayIndex: number,
    entryIndex: number,
    field: "startTime" | "endTime" | "hours",
    value: string,
  ) => {
    setWeekData((prevWeekData) =>
      prevWeekData.map((day, dIndex) => {
        if (dIndex === dayIndex) {
          const updatedEntries = day.entries.map((entry, eIndex) => {
            if (eIndex === entryIndex) {
              if (field === "hours") {
                return {
                  ...entry,
                  hours: parseFloat(value) || 0,
                };
              }
              return {
                ...entry,
                [field]: value,
              };
            }
            return entry;
          });
          return {
            ...day,
            entries: updatedEntries,
            totalHours: calculateDayHours(updatedEntries, day.useDirectHours),
          };
        }
        return day;
      }),
    );
  };

  const toggleInputMode = (dayIndex: number) => {
    setWeekData((prevWeekData) =>
      prevWeekData.map((day, dIndex) => {
        if (dIndex === dayIndex) {
          const newUseDirectHours = !day.useDirectHours;
          return {
            ...day,
            useDirectHours: newUseDirectHours,
            // Recalculate total hours based on new mode but keep all entries
            totalHours: calculateDayHours(day.entries, newUseDirectHours),
          };
        }
        return day;
      }),
    );
  };

  const addTimeEntry = (dayIndex: number) => {
    setWeekData((prevWeekData) =>
      prevWeekData.map((day, dIndex) => {
        if (dIndex === dayIndex) {
          return {
            ...day,
            entries: [...day.entries, { startTime: "", endTime: "", hours: 0 }],
          };
        }
        return day;
      }),
    );
  };

  const deleteTimeEntry = (dayIndex: number, entryIndex: number) => {
    setWeekData((prevWeekData) =>
      prevWeekData.map((day, dIndex) => {
        if (dIndex === dayIndex) {
          const updatedEntries = day.entries.filter(
            (_, eIndex) => eIndex !== entryIndex,
          );
          return {
            ...day,
            entries: updatedEntries,
            totalHours: calculateDayHours(updatedEntries, day.useDirectHours),
          };
        }
        return day;
      }),
    );
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = event.target.value;
    if (!dateValue || !/\d{4}-\d{2}-\d{2}/.test(dateValue)) {
      // Handle invalid date string format, perhaps by logging an error or ignoring
      console.warn("Invalid date format selected");
      return;
    }
    const parts = dateValue.split("-").map(Number);
    const year = parts[0];
    const month = parts[1];
    const day = parts[2];

    if (
      year === undefined ||
      month === undefined ||
      day === undefined ||
      isNaN(year) ||
      isNaN(month) ||
      isNaN(day)
    ) {
      console.warn("Invalid date components after parsing");
      return;
    }

    // Create date in local timezone to avoid UTC conversion issues from YYYY-MM-DD string
    const newSelectedDate = new Date(year, month - 1, day);
    setSelectedMonday(getMonday(newSelectedDate));
  };

  const totalWeekHours = weekData.reduce(
    (total, day) => total + day.totalHours,
    0,
  );

  const importJSON = () => {
    const confirmImport = window.confirm(
      "Do you want to import a JSON file? It will override all your current data.",
    );
    if (!confirmImport) {
      return;
    }
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const downloadJSON = () => {
    const data = {
      selectedMonday: selectedMonday,
      weekData: weekData,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    // Format filename with the week's date range
    const startDate = selectedMonday.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const endDate = new Date(selectedMonday);
    endDate.setDate(selectedMonday.getDate() + 6);
    const endDateStr = endDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const link = document.createElement("a");
    link.href = url;
    link.download = `timesheet_${startDate}-${endDateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const clearAll = () => {
    // Clear all timesheet data from localStorage
    if (typeof window !== "undefined") {
      const allKeys = Object.keys(localStorage);
      allKeys.forEach((key) => {
        if (key.startsWith(TIMESHEET_PREFIX)) {
          removeLocalStorage(key);
        }
      });
    }

    // Clear wage
    setHourlyWage(0);
    removeLocalStorage(WAGE_KEY);

    // Get the current Monday
    const newMonday = getMonday(new Date());

    // Initialize new empty week with clean input fields
    const emptyEntry = {
      startTime: "", // Ensure empty string for time inputs
      endTime: "", // Ensure empty string for time inputs
      hours: 0, // Reset hours to 0
    };

    const newWeekData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(newMonday);
      date.setDate(newMonday.getDate() + i);
      return {
        date,
        entries: [{ ...emptyEntry }], // Use spread to ensure a new object
        totalHours: 0,
        useDirectHours: false,
      };
    });

    // Reset file input if it exists
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // Update state with new empty week
    setSelectedMonday(newMonday);
    setWeekData(newWeekData);
  };

  // Add confirmation to clear all
  const handleClearAll = () => {
    if (
      window.confirm(
        "Are you sure you want to clear all timesheet data? This cannot be undone.",
      )
    ) {
      clearAll();
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        // Validate the imported data structure
        if (!data.selectedMonday || !Array.isArray(data.weekData)) {
          throw new Error("Invalid timesheet data format");
        }

        // Convert date strings back to Date objects
        const importedMonday = new Date(data.selectedMonday);
        const importedWeekData = data.weekData.map((day: any) => ({
          ...day,
          date: new Date(day.date),
          entries: day.entries.map((entry: any) => ({
            startTime: entry.startTime ?? "",
            endTime: entry.endTime ?? "",
            hours: entry.hours ?? 0,
          })),
        }));

        // Update state with imported data
        setSelectedMonday(importedMonday);
        setWeekData(importedWeekData);

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        // Save imported data to localStorage
        const key = getLocalStorageKey(importedMonday);
        setLocalStorage(key, JSON.stringify(importedWeekData));
      } catch (error) {
        console.error("Error importing timesheet:", error);
        alert(
          "Failed to import timesheet. Please make sure the file is a valid timesheet JSON export.",
        );
      }
    };
    reader.readAsText(file);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleWageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const wage = value === "" ? 0 : parseFloat(value);
    if (!isNaN(wage) && wage >= 0) {
      setHourlyWage(wage);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-start bg-white p-8 text-gray-800">
      <h1 className="mb-4 text-4xl font-bold">Time Sheet Calculator</h1>
      <div className="flex max-w-2xl flex-col items-center">
        <p className="mb-4">
          This tool will allow you to input your time worked. It will show you
          the hours and total. It will automatically save locally to your device
          for each week.
        </p>
        <div className="flex items-start gap-2 md:-ml-8">
          <InfoIcon className="mt-1 shrink-0" size={16} /> Tip: If you do not
          see the inputs filled and you are selecting the same week, you may
          need to select the week. You can also switch between time entry and
          direct hours modes without losing your entries.
        </div>
      </div>

      <div className="my-6 flex w-full max-w-7xl flex-col items-start gap-2">
        <div className="mx-auto flex w-full flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <div className="flex flex-col items-start">
              <label
                htmlFor="week-picker"
                className="mb-1 text-sm font-bold font-extrabold text-gray-700"
              >
                Select Week Starting (Monday):
              </label>
              <Input
                type="date"
                id="week-picker"
                value={selectedMonday.toISOString().split("T")[0]}
                onChange={handleDateChange}
                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div className="flex flex-col items-start">
              <label
                htmlFor="hourly-wage"
                className="mb-1 text-sm font-bold font-extrabold text-gray-700"
              >
                Hourly Wage:
              </label>
              <div className="relative">
                <DollarSign className="absolute top-2.5 left-2 h-4 w-4 text-gray-500" />
                <Input
                  type="number"
                  id="hourly-wage"
                  min="0"
                  step="0.01"
                  value={hourlyWage || ""}
                  onChange={handleWageChange}
                  placeholder="0.00"
                  className="rounded-md border-gray-300 pl-8 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              ref={fileInputRef}
              className="hidden"
            />
            <Button
              onClick={importJSON}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Upload size={16} />
              Import JSON
            </Button>
            <Button
              onClick={downloadJSON}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download size={16} />
              Export JSON
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={handleClearAll}
            >
              <TrashIcon size={16} />
              Clear All
            </Button>
          </div>
        </div>
        <div className="mt-2 text-lg font-semibold text-gray-700">
          {getWeekRangeDisplay(selectedMonday)}
        </div>
      </div>

      <div className="grid w-full max-w-7xl gap-4 md:grid-cols-2 lg:grid-cols-3">
        {weekData.map((day, dayIndex) => (
          <Card key={day.date.toISOString()} className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                {day.date.toLocaleDateString("en-US", { weekday: "long" })}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleInputMode(dayIndex)}
                className="text-sm"
              >
                {day.useDirectHours
                  ? "Switch to Time Entry"
                  : "Switch to Hours Entry"}
              </Button>
            </CardHeader>
            <CardContent>
              {day.entries.map((entry, entryIndex) => (
                <div key={entryIndex} className="mb-2 flex items-center gap-4">
                  {day.useDirectHours ? (
                    <Input
                      type="number"
                      min="0"
                      step="0.25"
                      placeholder="Hours"
                      value={entry.hours || ""}
                      onChange={(e) =>
                        handleTimeChange(
                          dayIndex,
                          entryIndex,
                          "hours",
                          e.target.value,
                        )
                      }
                      className="w-32"
                    />
                  ) : (
                    <>
                      <Input
                        type="time"
                        value={entry.startTime}
                        onChange={(e) =>
                          handleTimeChange(
                            dayIndex,
                            entryIndex,
                            "startTime",
                            e.target.value,
                          )
                        }
                      />
                      <Input
                        type="time"
                        value={entry.endTime}
                        onChange={(e) =>
                          handleTimeChange(
                            dayIndex,
                            entryIndex,
                            "endTime",
                            e.target.value,
                          )
                        }
                      />
                    </>
                  )}
                  {entryIndex > 0 ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                      onClick={() => deleteTimeEntry(dayIndex, entryIndex)}
                    >
                      ×
                    </Button>
                  ) : (
                    <div className="ml-4 h-8 w-8"></div>
                  )}
                </div>
              ))}

              <Button onClick={() => addTimeEntry(dayIndex)} className="mt-2">
                Add {day.useDirectHours ? "Hours" : "Time"} Entry
              </Button>

              <div className="mt-4 space-y-1">
                <div className="font-semibold">
                  Daily Total: {day.totalHours.toFixed(2)} hours
                </div>
                {hourlyWage > 0 && (
                  <div className="text-sm text-gray-600">
                    Estimated Earnings:{" "}
                    {formatCurrency(day.totalHours * hourlyWage)}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="mt-6 space-y-2">
          <div className="text-2xl font-bold">
            Weekly Total: {totalWeekHours.toFixed(2)} hours
          </div>
          {hourlyWage > 0 && (
            <div className="text-xl text-gray-700">
              Gross Weekly Earnings:{" "}
              {formatCurrency(totalWeekHours * hourlyWage)}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
