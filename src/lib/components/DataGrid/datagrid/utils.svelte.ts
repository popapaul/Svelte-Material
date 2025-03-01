import type { AnyColumn, GroupColumn } from "./types";
import type { CellValue, ColumnId, CustomCellComponentWithProps, SortableColumn } from "./types";
import type { DatagridCore } from "./index.svelte";
import Fuse, { type IFuseOptions } from "fuse.js";
import { DEFAULT_FUSE_OPTIONS } from "./defaults";


export function generateRandomColumnId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function getCellContent(column: AnyColumn<any>, originalRow: any): CellValue | HTMLElement {
    switch (column.type) {
        case 'accessor':
            if (column.formatterFn) {
                return column.formatterFn(originalRow);
            } else if (column.cell) {
                return column.cell(originalRow);
            } else {
                return column.accessorFn(originalRow);
            }
        case 'computed':
            if (column.formatterFn) {
                return column.formatterFn(originalRow);
            } else if (column.cell) {
                return column.cell(originalRow);
            } else {
                return column.accessorFn(originalRow);
            }
        case 'display':
            if (column.cell) {
                return column.cell(originalRow);
            } else {
                throw new Error('Display columns must have a cell function');
            }
        case 'group':
            throw new Error('Group columns are not supported');
    }
}


export function flattenColumnStructure(
    columns: AnyColumn<any>[],
    preserveGroups: boolean = false
): AnyColumn<any>[] {
    const flattened: AnyColumn<any>[] = [];

    const processColumns = (columns: AnyColumn<any>[], result: AnyColumn<any>[]) => {
        for (let i = 0; i < columns.length; i++) {
            const column = columns[i];
            if (column.type === 'group') {
                processColumns(column.columns, result);
                result.push(preserveGroups ? column : { ...column, columns: [] });
            } else {
                result.push(column);
            }
        }
    };

    processColumns(columns, flattened);
    return flattened;
}

export function flattenColumnStructureAndClearGroups(columns: AnyColumn<any>[]): AnyColumn<any>[] {
    return flattenColumnStructure(columns, false);
}

export function flattenColumnStructurePreservingGroups(columns: AnyColumn<any>[]): AnyColumn<any>[] {
    return flattenColumnStructure(columns, true);
}

// Find column by ID in nested structure
export function findColumnById<TOriginalRow>(flatColumns: AnyColumn<TOriginalRow>[], id: ColumnId): AnyColumn<TOriginalRow> | null {
    return flatColumns.find((col) => col.columnId === id) ?? null;
}

export function isInGroupTree(possibleDescendant: GroupColumn<any>, ancestor: GroupColumn<any>): boolean {
    if (!possibleDescendant) return false;

    // Check if the possible descendant is a direct child of the ancestor
    if (ancestor.columns.includes(possibleDescendant)) return true;

    // Recursively check if the possible descendant is a descendant of any group columns
    return ancestor.columns
        .filter((col): col is GroupColumn<any> => col.type === 'group') // Type guard to ensure we only check GroupColumn types
        .some(childGroup => isInGroupTree(possibleDescendant, childGroup)); // Recursive call for group columns
}

// Get sort index for display
export const getSortIndex = (datagrid: DatagridCore<any>, column: AnyColumn<any>): number | null => {
    column = column as SortableColumn<any>;
    if (!column.options.sortable) return null;
    const columnId = column.columnId || column.header;
    const sortConfig = datagrid.features.sorting.sortings.find((config) => config.columnId === columnId);
    return sortConfig ? sortConfig.index + 1 : null;
};


export const getSortDirection = (datagrid: DatagridCore<any>, column: AnyColumn<any>): 'desc' | 'asc' | 'intermediate' | null => {
    column = column as SortableColumn<any>;
    if (!column.options.sortable) return null;
    const columnId = column.columnId || column.header;
    const sortConfig = datagrid.features.sorting.sortings.find((config) => config.columnId === columnId);
    if (!sortConfig) return 'intermediate';
    return sortConfig.desc ? 'desc' : 'asc';
};

export function isCellComponent(value: any): value is CustomCellComponentWithProps {
    return value && typeof value === 'object' && 'component' in value
}


export function debounce<T extends (...args: any[]) => void>(func: T, delay: number): T {
    let timer: ReturnType<typeof setTimeout>;
    return ((...args: Parameters<T>) => {
        clearTimeout(timer);
        timer = setTimeout(() => func(...args), delay);
    }) as T;
}


/**
 * Initializes a new Fuse.js instance with the provided items and search keys.
 * This is used to set up the search functionality for the given data.
 * @param items - The array of items to search through.
 * @param keys - The keys within each item to search on.
 * @returns The initialized Fuse.js instance configured with search options.
 */
export function initializeFuseInstance<T>(items: T[], keys: string[], config: IFuseOptions<T> = DEFAULT_FUSE_OPTIONS): Fuse<T> {
    // Configure Fuse.js options to perform fuzzy search
    return new Fuse(items, {
        keys,               // Specify which fields to search on
        ...config,          // Merge default options with provided options
    });
}