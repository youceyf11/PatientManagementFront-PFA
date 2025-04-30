import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Invoice, User } from "@shared/schema";
import { format } from "date-fns";

type InvoiceTableProps = {
  invoices: Invoice[];
  users: User[];
  onView?: (id: number) => void;
  onDownload?: (id: number) => void;
  onMarkAsPaid?: (id: number) => void;
  onGenerateInvoice?: (id: number) => void;
};

export function InvoiceTable({
  invoices,
  users,
  onView,
  onDownload,
  onMarkAsPaid,
  onGenerateInvoice
}: InvoiceTableProps) {
  const getPatient = (patientId: number) => {
    return users.find(user => user.id === patientId);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100); // Convert cents to dollars
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'MMM d, yyyy');
  };

  // Helper for invoice number formatting
  const formatInvoiceNumber = (id: number) => {
    return `INV-${new Date().getFullYear()}-${id.toString().padStart(4, '0')}`;
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Invoice #
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Patient
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Due Date
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {invoices.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                No invoices found
              </td>
            </tr>
          ) : (
            invoices.map(invoice => {
              const patient = getPatient(invoice.patientId);
              return (
                <tr key={invoice.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatInvoiceNumber(invoice.id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {patient?.fullName || 'Unknown Patient'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(invoice.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(invoice.dueDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge 
                      variant="outline" 
                      className={invoice.isPaid 
                        ? "bg-green-100 text-green-800" 
                        : "bg-yellow-100 text-yellow-800"
                      }
                    >
                      {invoice.isPaid ? 'Paid' : 'Pending'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {onView && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(invoice.id)}
                        className="text-primary hover:text-primary/80 mr-2"
                      >
                        View
                      </Button>
                    )}
                    {onDownload && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDownload(invoice.id)}
                        className="text-gray-600 hover:text-gray-900 mr-2"
                      >
                        Download
                      </Button>
                    )}
                    {onMarkAsPaid && !invoice.isPaid && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onMarkAsPaid(invoice.id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Mark as Paid
                      </Button>
                    )}
                    {onGenerateInvoice && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onGenerateInvoice(invoice.id)}
                        className="text-primary hover:text-primary/80"
                      >
                        Generate Invoice
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
