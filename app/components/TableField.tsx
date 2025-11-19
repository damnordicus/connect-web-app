import { CalendarRange, Table } from "lucide-react";
import { Card, CardContent, CardHeader } from "./ui/card";
import React, { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";

interface TableData {
    id: string;
    title: string;
    headers: string[];
    // rows: string[];
    data: string[][];
}

export default function TableField({ tableData, setTableData }: {tableData: TableData[], setTableData: React.Dispatch<React.SetStateAction<TableData[]>>}){
    const [showBuilder, setShowBuilder] = useState(false);
    const [rows, setRows] = useState(0);
    const [columns, setColumns] = useState(0);
    const data = tableData;
    console.log(tableData)
    // const [tables, setTables] = useState<TableData[]>(tableData);
    const options: number[] = [1,2,3,4,5,6,7,8,9,10];

    const handleAddTable = () => {
        if (rows > 0 && columns > 0) {
            setTableData([...data, { 
                id: Date.now().toString(), 
                title: "Enter a title",
                headers: Array(columns).fill(''), // Empty column headers
                data: Array(rows).fill(null).map(() => Array(columns).fill('')) // Empty cells
            }]);
            console.log('tableData', tableData)
            setRows(0);
            setColumns(0);
            setShowBuilder(false);
        }
    };

    // Update table title
    const updateTableTitle = (tableId: string, newTitle: string) => {
        setTableData(data.map(table => 
            table.id === tableId ? { ...table, title: newTitle } : table
        ));
    };

    // Update column header
    const updateHeader = (tableId: string, colIndex: number, value: string) => {
        setTableData(data.map(table => {
            if (table.id === tableId) {
                const newHeaders = [...table.headers];
                newHeaders[colIndex] = value;
                return { ...table, headers: newHeaders };
            }
            return table;
        }));
    };

    // Update cell data
    const updateCell = (tableId: string, rowIndex: number, colIndex: number, value: string) => {
        setTableData(data.map(table => {
            if (table.id === tableId) {
                const newData = table.data.map((row, rIdx) => 
                    rIdx === rowIndex 
                        ? row.map((cell, cIdx) => cIdx === colIndex ? value : cell)
                        : row
                );
                return { ...table, data: newData };
            }
            return table;
        }));
    };

    return (
        <div className="col-span-2">
            <Card className="rounded-lg">
                <CardHeader className="flex items-center font-semibold">
                    <div className="inline-flex items-center gap-2">
                        <Table size={18}/>
                        Table
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Existing Tables */}
                    {data?.length > 0 && data.map((data) => (
                        <div key={data.id} className="space-y-2">
                            <input
                                type="text"
                                value={data.title}
                                onChange={(e) => updateTableTitle(data.id, e.target.value)}
                                className="text-center font-semibold w-full bg-transparent border-b focus:outline-none focus:border-blue-500"
                            />
                            <div className="flex w-fit mx-auto justify-center border rounded-xl overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
                                <table className="border-collapse">
                                    <thead className="rounded-xl">
                                        <tr className="bg-primary/40 ">
                                            {data.headers.map((header, colIndex) => (
                                                <th key={colIndex} className="border px-4 py-2 font-medium text-sm">
                                                    <input
                                                        type="text"
                                                        value={header}
                                                        onChange={(e) => updateHeader(data.id, colIndex, e.target.value)}
                                                        className="w-full bg-transparent focus:outline-none"
                                                        placeholder="Column Name"
                                                    />
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.data.map((row, rowIndex) => (
                                            <tr key={rowIndex} className="hover:bg-gray-500 bg-primary/5">
                                                {row.map((cell, colIndex) => (
                                                    <td key={colIndex} className="border-t px-4 py-2 text-sm text-center">
                                                        <input 
                                                            type="text"
                                                            value={cell}
                                                            onChange={(e) => updateCell(data.id, rowIndex, colIndex, e.target.value)}
                                                            className="w-full focus:outline-none focus:ring-1 focus:ring-blue-500 px-1"
                                                            placeholder="Enter data"
                                                        />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}


                    {/* Table Builder Controls */}
                    {showBuilder && (
                        <div className="border-t pt-4">
                            <div className="flex flex-col gap-4 max-w-md mx-auto">
                                <div className="flex items-center gap-3">
                                    <label className="text-sm font-medium w-20">Rows:</label>
                                    <Select onValueChange={(e) => setRows(+e)} value={rows > 0 ? rows.toString() : undefined}>
                                        <SelectTrigger className="flex-1">
                                            <SelectValue placeholder="Select rows"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {options.map((item, index) => (
                                                <SelectItem key={index} value={item.toString()}>
                                                    {item}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    <label className="text-sm font-medium w-20">Columns:</label>
                                    <Select onValueChange={(e) => setColumns(+e)} value={columns > 0 ? columns.toString() : undefined}>
                                        <SelectTrigger className="flex-1">
                                            <SelectValue placeholder="Select columns"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {options.map((item, index) => (
                                                <SelectItem key={index} value={item.toString()}>
                                                    {item}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex gap-2 justify-end">
                                    <Button 
                                        type="button" 
                                        variant="outline"
                                        onClick={() => {
                                            setShowBuilder(false);
                                            setRows(0);
                                            setColumns(0);
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        type="button" 
                                        onClick={handleAddTable}
                                        disabled={rows === 0 || columns === 0}
                                    >
                                        Add Table
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Add Table Button */}
                    <div className="flex justify-center pt-4">
                        <Card 
                            className="w-fit rounded-lg cursor-pointer hover:bg-gray-50 transition-colors border-dashed border-2" 
                            onClick={() => setShowBuilder(true)}
                        >
                            <CardContent className="flex flex-col items-center justify-center p-6 gap-2">
                                <CalendarRange size={30} className="text-gray-600"/>
                                <span className="text-sm text-gray-600 font-medium">Add Table</span>
                            </CardContent>
                        </Card>
                    </div>
                </CardContent>
            </Card>
            <input type="hidden" name="table_data" value={JSON.stringify(tableData)}/>
        </div>
    )
}