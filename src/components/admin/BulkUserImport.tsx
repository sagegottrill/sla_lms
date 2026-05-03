import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Download, CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DESIGN_TOKENS } from "@/lib/design-tokens";

interface ImportResult {
  email: string;
  name: string;
  role: string;
  status: "success" | "error";
  error?: string;
}

export function BulkUserImport({ onComplete }: { onComplete?: () => void }) {
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const csv = `name,email,role,password
Jane Doe,jane@example.com,instructor,TempPass123!
John Smith,john@example.com,program_manager,TempPass456!
Alice Johnson,alice@example.com,instructor,TempPass789!`;
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk_user_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Template downloaded");
  };

  const parseCSV = (text: string): Array<{ name: string; email: string; role: string; password: string }> => {
    const lines = text.trim().split("\n");
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    
    const nameIdx = headers.indexOf("name");
    const emailIdx = headers.indexOf("email");
    const roleIdx = headers.indexOf("role");
    const passwordIdx = headers.indexOf("password");
    
    if (nameIdx === -1 || emailIdx === -1 || roleIdx === -1 || passwordIdx === -1) {
      throw new Error("CSV must have columns: name, email, role, password");
    }
    
    const rows: Array<{ name: string; email: string; role: string; password: string }> = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(",").map(v => v.trim());
      
      rows.push({
        name: values[nameIdx] || "",
        email: values[emailIdx] || "",
        role: values[roleIdx] || "",
        password: values[passwordIdx] || "",
      });
    }
    
    return rows;
  };

  const validateRow = (row: { name: string; email: string; role: string; password: string }): string | null => {
    if (!row.name) return "Name is required";
    if (!row.email || !row.email.includes("@")) return "Valid email is required";
    if (!["instructor", "program_manager", "admin"].includes(row.role)) {
      return "Role must be: instructor, program_manager, or admin";
    }
    if (!row.password || row.password.length < 8) {
      return "Password must be at least 8 characters";
    }
    return null;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setImporting(true);
    setResults([]);
    setShowResults(false);
    
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      
      if (rows.length === 0) {
        toast.error("No valid rows found in CSV");
        setImporting(false);
        return;
      }
      
      if (rows.length > 100) {
        toast.error("Maximum 100 users per import");
        setImporting(false);
        return;
      }
      
      toast.info(`Importing ${rows.length} users...`);
      
      const importResults: ImportResult[] = [];
      
      for (const row of rows) {
        const validationError = validateRow(row);
        
        if (validationError) {
          importResults.push({
            ...row,
            status: "error",
            error: validationError,
          });
          continue;
        }
        
        try {
          const { data, error } = await supabase.functions.invoke("invite-staff", {
            body: {
              email: row.email,
              name: row.name,
              password: row.password,
              role: row.role,
            },
          });
          
          if (error || data?.error) {
            importResults.push({
              ...row,
              status: "error",
              error: error?.message || data?.error || "Failed to create user",
            });
          } else {
            importResults.push({
              ...row,
              status: "success",
            });
          }
        } catch (err: any) {
          importResults.push({
            ...row,
            status: "error",
            error: err.message || "Unexpected error",
          });
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      setResults(importResults);
      setShowResults(true);
      
      const successCount = importResults.filter(r => r.status === "success").length;
      const errorCount = importResults.filter(r => r.status === "error").length;
      
      if (errorCount === 0) {
        toast.success(`Successfully imported ${successCount} users`);
      } else {
        toast.warning(`Imported ${successCount} users, ${errorCount} failed`);
      }
      
      if (onComplete) onComplete();
    } catch (err: any) {
      toast.error(err.message || "Failed to parse CSV file");
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const successCount = results.filter(r => r.status === "success").length;
  const errorCount = results.filter(r => r.status === "error").length;

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className={cn(DESIGN_TOKENS.card, "p-6")}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-display font-semibold text-lg text-foreground mb-1">
              Bulk User Import
            </h3>
            <p className={cn(DESIGN_TOKENS.pageSubtitle, "text-sm")}>
              Import multiple staff members at once via CSV file
            </p>
          </div>
          <Button
            variant="outline"
            onClick={downloadTemplate}
            className="rounded-xl text-xs"
          >
            <Download className={cn(DESIGN_TOKENS.iconSmall, "mr-2")} />
            Download Template
          </Button>
        </div>

        <div className="space-y-4">
          {/* Instructions */}
          <div className="bg-muted/20 rounded-xl p-4 ring-1 ring-black/5 dark:ring-white/10 border-0">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-foreground">CSV Format Requirements:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Required columns: <code className="text-xs bg-muted px-1 py-0.5 rounded">name</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">email</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">role</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">password</code></li>
                  <li>Valid roles: instructor, program_manager, admin</li>
                  <li>Password must be at least 8 characters</li>
                  <li>Maximum 100 users per import</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Upload Button */}
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={importing}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="bg-primary hover:bg-primary/90 text-white rounded-xl h-10 px-6 font-semibold"
            >
              {importing ? (
                <>
                  <Loader2 className={cn(DESIGN_TOKENS.iconSmall, "mr-2 animate-spin")} />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className={cn(DESIGN_TOKENS.iconSmall, "mr-2")} />
                  Upload CSV File
                </>
              )}
            </Button>
            {importing && (
              <span className="text-sm text-muted-foreground">
                This may take a few minutes...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Results Section */}
      {showResults && results.length > 0 && (
        <div className={cn(DESIGN_TOKENS.card, "p-6")}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-lg text-foreground">
              Import Results
            </h3>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span className="text-foreground font-semibold">{successCount} Success</span>
              </div>
              {errorCount > 0 && (
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-destructive" />
                  <span className="text-foreground font-semibold">{errorCount} Failed</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {results.map((result, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-start justify-between p-3 rounded-lg",
                  result.status === "success"
                    ? "bg-emerald-50 dark:bg-emerald-950/20"
                    : "bg-destructive/5"
                )}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {result.status === "success" ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {result.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {result.email} · {result.role}
                    </p>
                    {result.error && (
                      <p className="text-xs text-destructive mt-1">{result.error}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
