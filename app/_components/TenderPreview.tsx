import { Tender } from "@/types/Tender";

export function TenderPreview({ tender }: { tender: Tender }) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="border-b pb-3 mb-3">
        <h3 className="font-bold text-lg text-cyan-900">{tender.tenderNo}</h3>

        <p className="text-sm text-muted-foreground">{tender.client}</p>
      </div>

      {/* Description */}
      <div>
        <p className="text-sm text-slate-600">{tender.description}</p>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <div>
          <div className="text-muted-foreground">Department</div>
          <div className="font-medium">{tender.tenderingDepartment || "-"}</div>
        </div>

        <div>
          <div className="text-muted-foreground">Status</div>
          <div className="font-medium">{tender.status || "-"}</div>
        </div>

        <div>
          <div className="text-muted-foreground">Position</div>
          <div className="font-medium">{tender.position || "-"}</div>
        </div>

        <div>
          <div className="text-muted-foreground">Tender Value</div>
          <div className="font-semibold text-green-600">
            ₹{Number(tender.tenderValue || 0).toLocaleString("en-IN")}
          </div>
        </div>

        <div>
          <div className="text-muted-foreground">EMD</div>
          <div className="font-medium">
            ₹{Number(tender.emdAmount || 0).toLocaleString("en-IN")}
          </div>
        </div>

        <div>
          <div className="text-muted-foreground">BG Amount</div>
          <div className="font-medium">
            ₹{Number(tender.bgAmount || 0).toLocaleString("en-IN")}
          </div>
        </div>

        <div>
          <div className="text-muted-foreground">Vertical</div>
          <div className="font-medium">{tender.vertical || "-"}</div>
        </div>

        <div>
          <div className="text-muted-foreground">Sub Vertical</div>
          <div className="font-medium">{tender.subVertical || "-"}</div>
        </div>

        <div>
          <div className="text-muted-foreground">Country</div>
          <div className="font-medium">{tender.country || "-"}</div>
        </div>

        <div>
          <div className="text-muted-foreground">State</div>
          <div className="font-medium">{tender.state || "-"}</div>
        </div>

        <div>
          <div className="text-muted-foreground">Tender Date</div>
          <div className="font-medium">
            {tender.tenderDate
              ? new Date(tender.tenderDate).toLocaleDateString("en-IN")
              : "-"}
          </div>
        </div>

        <div>
          <div className="text-muted-foreground">Opening Date</div>
          <div className="font-medium">
            {tender.tenderOpeningDate
              ? new Date(tender.tenderOpeningDate).toLocaleDateString("en-IN")
              : "-"}
          </div>
        </div>
      </div>
    </div>
  );
}
