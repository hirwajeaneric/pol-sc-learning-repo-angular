/**
 * Excel template generateion and parsing for grade entry (parity with main app)
 */
import * as XLSX from 'xlsx';

const COL_CODE = 'Code/Id';
const COL_NAME = 'Name';
const COL_CRITERIAL = ['A', 'B', 'C', 'D'];
const COL_TOTAL = 'Total';
const COL_COMMENT = 'Commentaire';

const PP_COL_PREFIX = '__pp__';
const PP_COURSE_HEADER = `${PP_COL_PREFIX}COURSE`;

export interface GradeExcelEntry {
    studentId: string;
    criteriaA: number | null;
    criteriaB: number | null;
    criteriaC: number | null;
    criteriaD: number | null;
    ppPeriodGrade: number | null;
    comment: string | null;
}

export interface ParseGradeExcelResult {
    entries: GradeExcelEntry[];
    errors: string[];
}

function normalizePpExcelLabel(raw: string): string | null {
    const u = String(raw ?? '')
    .toUpperCase()
    .trim();
    if (!u || u === '-' || u === '-') return null;
    if (u === 'N') return 'NE';
    if (u === 'TB' || u === 'B' || u === 'AA' || u === 'NA' || u === 'NE') return u;
    return null;
}

/** Standard (non-PP) template: headers + criterion label row + one row per student. */
