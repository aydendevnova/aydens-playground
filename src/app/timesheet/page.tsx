import TimeSheetClient from "./page-client";

export const metadata = {
  title: "Hourly Time and Wage Calculator",
  description:
    "A comprehensive timesheet tool for calculating work hours, daily and weekly totals, and estimated earnings based on hourly wage. Track multiple time entries per day and view earnings projections.",
};

export default function Timesheet() {
  return <TimeSheetClient />;
}
