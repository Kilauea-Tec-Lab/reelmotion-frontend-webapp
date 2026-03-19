import React from "react";
import { cn } from "@/lib/utils";
import { CheckIcon, MinusIcon } from "lucide-react";
import { Badge } from "./badge";

function PricingTable({ className, ...props }) {
  return (
    <div data-slot="table-container" className="relative w-full overflow-x-auto">
      <table className={cn("w-full text-sm", className)} {...props} />
    </div>
  );
}

function PricingTableHeader({ ...props }) {
  return <thead data-slot="table-header" {...props} />;
}

function PricingTableBody({ className, ...props }) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr]:divide-x [&_tr]:border-b", className)}
      {...props}
    />
  );
}

function PricingTableRow({ ...props }) {
  return <tr data-slot="table-row" {...props} />;
}

function PricingTableCell({ className, children, ...props }) {
  return (
    <td
      data-slot="table-cell"
      className={cn("p-4 align-middle whitespace-nowrap", className)}
      {...props}
    >
      {children === true ? (
        <CheckIcon aria-hidden="true" className="size-4 text-[#DC569D]" />
      ) : children === false ? (
        <MinusIcon aria-hidden="true" className="size-4 text-white/20" />
      ) : (
        children
      )}
    </td>
  );
}

function PricingTableHead({ className, ...props }) {
  return (
    <th
      data-slot="table-head"
      className={cn("p-2 text-left align-middle font-medium whitespace-nowrap", className)}
      {...props}
    />
  );
}

function PricingTablePlan({ name, badge, price, compareAt, icon: Icon, children, className, ...props }) {
  return (
    <div
      className={cn(
        "relative h-full overflow-hidden rounded-lg border border-white/10 bg-white/5 p-3 font-normal backdrop-blur-sm",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center rounded-full border border-white/10 p-1.5">
          {Icon && <Icon className="h-3 w-3 text-white/70" />}
        </div>
        <h3 className="font-mono text-sm text-white/60">{name}</h3>
        <Badge
          variant="secondary"
          className="ml-auto rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-normal text-white/50"
        >
          {badge}
        </Badge>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-bold text-white">{price}</span>
        {compareAt && (
          <span className="text-sm text-white/30 line-through">{compareAt}</span>
        )}
      </div>

      <div className="relative z-10 mt-4">{children}</div>
    </div>
  );
}

export {
  PricingTable,
  PricingTableHeader,
  PricingTableBody,
  PricingTableRow,
  PricingTableHead,
  PricingTableCell,
  PricingTablePlan,
};
