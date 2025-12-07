import { CalendarRange, Edit, EllipsisVertical, Option, Save, Table, X } from "lucide-react";
import { Card, CardContent, CardHeader } from "./ui/card";
import React, { useState, useEffect, useRef, type SetStateAction } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Checkbox } from "./ui/checkbox";

export interface TableData {
    id: string;
    title: string;
    headers: string[];
    data: string[][];
}

export default function TableField({ 
    tableData, 
    setTableData, 
    editedTables,
    setEditedTables,
    deleteTables,
    setDeleteTables,
 }: {
    tableData: TableData[], 
    setTableData: React.Dispatch<SetStateAction<TableData[]>>, 
    editedTables: TableData[],
    setEditedTables: React.Dispatch<SetStateAction<TableData[]>>,
    deleteTables: TableData[],
    setDeleteTables: React.Dispatch<SetStateAction<TableData[]>>,
}){
    const [showBuilder, setShowBuilder] = useState(false);
    const [rows, setRows] = useState(0);
    const [columns, setColumns] = useState(0);
    const [editingTableId, setEditingTableId] = useState<string | null>(null); // Track which table is being edited
    const data = tableData ?? [];
    const [deleteTableId, setDeleteTableId] = useState<string[]>([]);
    const [deleteClicked, setDeleteClicked] = useState(false);
    
    // Store original state of tables to detect changes
    const originalTablesRef = useRef<Map<string, TableData>>(new Map());
    
    // Initialize original tables on mount
    useEffect(() => {
        data.forEach(table => {
            if (!originalTablesRef.current.has(table.id)) {
                // Deep clone to preserve original state
                originalTablesRef.current.set(table.id, JSON.parse(JSON.stringify(table)));
            }
        });
    }, []);
    
    const options: number[] = [1,2,3,4,5,6,7,8,9,10];

    // Check if a table has been modified from its original state
    const isTableModified = (tableId: string, currentTable: TableData): boolean => {
        const original = originalTablesRef.current.get(tableId);
        if (!original) return true; // New table, always considered modified
        
        return JSON.stringify(original) !== JSON.stringify(currentTable);
    };

    // Update editedTables array based on modification status
    const updateEditedTables = (table: TableData) => {
        const isModified = isTableModified(table.id, table);
        
        if (isModified) {
            setEditedTables(prev => {
                const existingIndex = prev.findIndex(t => t.id === table.id);
                if (existingIndex >= 0) {
                    // Update existing entry
                    const updated = [...prev];
                    updated[existingIndex] = table;
                    return updated;
                } else {
                    // Add new entry
                    return [...prev, table];
                }
            });
        } else {
            // Remove from editedTables if reverted to original
            setEditedTables(prev => prev.filter(t => t.id !== table.id));
        }
    };

    const handleAddTable = () => {
        if (rows > 0 && columns > 0) {
            const newTable: TableData = { 
                id: Date.now().toString(), 
                title: "Enter a title",
                headers: Array(columns).fill(''),
                data: Array(rows).fill(null).map(() => Array(columns).fill(''))
            };
            
            setTableData([...data, newTable]);
            
            // New tables are automatically added to editedTables and set to editing mode
            setEditedTables(prev => [...prev, newTable]);
            setEditingTableId(newTable.id);
            
            setRows(0);
            setColumns(0);
            setShowBuilder(false);
        }
    };

    // Update table title
    const updateTableTitle = (tableId: string, newTitle: string) => {
        const updatedTables = data.map(table => 
            table.id === tableId ? { ...table, title: newTitle } : table
        );
        setTableData(updatedTables);
        
        const updatedTable = updatedTables.find(t => t.id === tableId);
        if (updatedTable) {
            updateEditedTables(updatedTable);
        }
    };

    // Update column header
    const updateHeader = (tableId: string, colIndex: number, value: string) => {
        const updatedTables = data.map(table => {
            if (table.id === tableId) {
                const newHeaders = [...table.headers];
                newHeaders[colIndex] = value;
                return { ...table, headers: newHeaders };
            }
            return table;
        });
        setTableData(updatedTables);
        
        const updatedTable = updatedTables.find(t => t.id === tableId);
        if (updatedTable) {
            updateEditedTables(updatedTable);
        }
    };

    // Update cell data
    const updateCell = (tableId: string, rowIndex: number, colIndex: number, value: string) => {
        const updatedTables = data.map(table => {
            if (table.id === tableId) {
                const newData = table.data.map((row, rIdx) => 
                    rIdx === rowIndex 
                        ? row.map((cell, cIdx) => cIdx === colIndex ? value : cell)
                        : row
                );
                return { ...table, data: newData };
            }
            return table;
        });
        setTableData(updatedTables);
        
        const updatedTable = updatedTables.find(t => t.id === tableId);
        if (updatedTable) {
            updateEditedTables(updatedTable);
        }
    };
    const [deleteSelect, setDeleteSelect] = useState(false)
    const [title, setTitle] = useState<Record<string, string>>(() => {
        const initialTitles: Record<string,string> = {};
        data.forEach(table => {
            initialTitles[table.id] = table.title;
        });
        return initialTitles
    });

    useEffect(() => {
        const newTitles: Record<string, string> = {};
        data.forEach(table => {
            if(title[table.id] === undefined){
                newTitles[table.id] = table.title;
            } else {
                newTitles[table.id] = title[table.id];
            }
        });
        setTitle(newTitles);
    },[data.length]);

    return (
        <div className="col-span-2">
            <Card className="rounded-sm">
                <CardHeader className="flex justify-between items-center font-semibold">
                    <div className="inline-flex items-center gap-2">
                        <Table size={18}/>
                        Table
                    </div>
                    <div className="inline-flex gap-4 items-center">
                    {deleteSelect && <Button variant={"destructive"} disabled={deleteTableId.length === 0} onClick={() => setDeleteClicked(true)}>Delete</Button>}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <EllipsisVertical size={18}/>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {!deleteSelect && <DropdownMenuItem onSelect={() => setDeleteSelect(true)} className="text-red-600 hover:bg-red-700/30 ">Delete Tables</DropdownMenuItem>}
                            {deleteSelect && <DropdownMenuItem onSelect={() => setDeleteSelect(false)}>Cancel</DropdownMenuItem>}                        
                        </DropdownMenuContent>
                    </DropdownMenu>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Existing Tables */}
                    {data?.length > 0 && data.map((table, index) => {
                        const isEditing = editingTableId === table.id;
                        
                        return (
                            <Accordion type="single" className={`relative w-full ${deleteSelect ? 'pl-8' : ''} transition-all`} collapsible>
                                {deleteSelect && <Checkbox onCheckedChange={() => setDeleteTableId((prev) => {
                                    if(prev.includes(table.id)){
                                        return prev.filter(id => id !== table.id)
                                    }else{
                                        return [...prev, table.id]
                                    }
                                }
                                )} className="absolute left-0 top-4 dark:text-red-600/80 dark:data-[state=checked]:bg-input/20 dark:data-[state=checked]:border-red-700"/>}
                                <AccordionItem  value={table.id}>
                                    <AccordionTrigger className="bg-primary/40 p-4 border shadow-[0_4px_16px_rgba(0,0,0,0.4)]">{!isEditing ? <div className="flex justify-between items-center w-full" >{title[table.id] ?? table.title}</div> : <input className="bg-input/50 w-full p-1 px-2 rounded-md border" type="text" value={title[table.id] ?? table.title} onChange={(e) => setTitle({...title, [table.id]: e.currentTarget.value})} onClick={(e) => e.stopPropagation()} />}</AccordionTrigger>
                                    <AccordionContent className=" flex justify-center bg-background/20 border-b rounded-b-lg py-4">
                                    <div className={`relative flex w-fit justify-center border rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.3)] `}>
                                    <table className=" border-collapse">
                                        <thead className="rounded-xl">
                                            <tr className="bg-primary/40">
                                                {table.headers.map((header, colIndex) => (
                                                    <th key={colIndex} className="border px-4 py-2 font-medium text-sm">
                                                        {editingTableId === table.id ? (
                                                            <input
                                                                type="text"
                                                                value={header}
                                                                onChange={(e) => updateHeader(table.id, colIndex, e.target.value)}
                                                                className="w-full bg-transparent focus:outline-none"
                                                                placeholder="Column Name"
                                                            />
                                                        ) : (
                                                            <p className="w-full bg-transparent">{header}</p>
                                                        )}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {table.data.map((row, rowIndex) => (
                                                <tr key={rowIndex} className="hover:bg-gray-500 bg-primary/5">
                                                    {row.map((cell, colIndex) => (
                                                        <td key={colIndex} className="border-t px-4 py-2 text-sm text-center">
                                                            {editingTableId === table.id ? (
                                                                <input 
                                                                    type="text"
                                                                    value={cell}
                                                                    onChange={(e) => updateCell(table.id, rowIndex, colIndex, e.target.value)}
                                                                    className="w-full focus:outline-none focus:ring-1 focus:ring-blue-500 px-1"
                                                                    placeholder="Enter data"
                                                                />
                                                            ) : (
                                                                <p className="w-full px-1">{cell}</p>
                                                            )}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div className={`absolute gap-2 flex ${editingTableId === table.id ? '-right-17' : '-right-8'} `} >
                                        {(editingTableId !== table.id && !deleteSelect) ? <Edit onClick={() => setEditingTableId(table.id)}/>
                                        : !deleteSelect ? <><Save onClick={() => {if(title[table.id] !== table.title){updateTableTitle(table.id, title[table.id]);} setEditingTableId(null)}}/><X onClick={() => setEditingTableId(null)}/></> : <></>}
                                    </div>
                                </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        );
                    })}

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
            {(editedTables && editedTables.length > 0) &&
            <input type="hidden" name="table_data" value={JSON.stringify(editedTables)}/>
            }
            {(deleteTableId.length > 0 && deleteClicked) &&
            <input type="hidden" name="delete_tables" value={JSON.stringify(deleteTableId)} />
            }
        </div>
    )
}