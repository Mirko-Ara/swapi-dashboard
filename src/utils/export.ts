import type { Starship, Person} from '@/types';
/**
 * It converts a JavaScript object's array in to a CSV String.
 * @param data array objects.
 * @returns CSV String.
 */

export const convertToCSV = (data: Starship[] | Person[]): string => {
    if(!data || data.length === 0) {
        return '';
    }
    const headers: string[] = Object.keys(data[0]);
    const csvHeaders: string = headers.join(',');
    const csvRows = data.map((row) => {
        return headers.map(header => {
            const key = header as keyof (Starship | Person);
            let value = row[key] === undefined || row[key] === null ? '' : row[key];
            value = String(value).replace(/"/g, '""');
            if (value.includes(',') || value.includes('\n') || value.includes('"')) {
                value = `"${value}"`;
            }
            return value;
        }).join(',');
    });
    return [csvHeaders, ...csvRows].join('\n');
};

/**
 * it exports data as JSON file downloadable.
 * @param data Data to exports.
 * @param filename Name of the file (without extension).
 */

export const exportToJson = (data: Starship[] | Person[], filename: string = 'data'): void => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

/**
 * it exports data as a CSV file downloadable.
 * @param data Data to exports.
 * @param filename Name of the file (without extension).
 */

export const exportCsv = (data: Starship[] | Person[], filename: string = 'data'): void => {
    const csvString = convertToCSV(data);
    const blob = new Blob([csvString], {type: 'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};