import { BRANCHES, SEMESTERS } from "../lib/types";
import { Select } from "./ui";

export function BranchSemesterFilter({
  branch,
  setBranch,
  semester,
  setSemester,
}: {
  branch: string;
  setBranch: (v: string) => void;
  semester: number | null;
  setSemester: (v: number | null) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={branch} onChange={(e) => setBranch(e.target.value)} className="w-auto">
        {BRANCHES.map((b) => (
          <option key={b} value={b}>{b}</option>
        ))}
      </Select>
      <Select
        value={semester ?? ""}
        onChange={(e) => setSemester(e.target.value ? Number(e.target.value) : null)}
        className="w-auto"
      >
        <option value="">All semesters</option>
        {SEMESTERS.map((s) => (
          <option key={s} value={s}>Semester {s}</option>
        ))}
      </Select>
    </div>
  );
}