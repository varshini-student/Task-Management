import { useCallback, useEffect, useState } from "react";
import SearchBar from "../components/SearchBar.jsx";
import Pagination from "../components/Pagination.jsx";
import EmployeeForm from "../components/EmployeeForm.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ErrorMessage from "../components/ErrorMessage.jsx";
import { createEmployee, getEmployees, updateEmployee } from "../services/employeeService.js";
import { getErrorMessage, getFieldErrors } from "../services/api.js";
import { useDebounce } from "../hooks/useDebounce.js";
import { useToast } from "../hooks/useToast.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { formatDate, formatDateTime, initials } from "../utils/format.js";
import { PAGE_SIZE } from "../utils/constants.js";

export default function Employees() {
  useDocumentTitle("Employees");
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({
    employees: [],
    currentPage: 1,
    totalPages: 0,
    totalEmployees: 0,
    limit: PAGE_SIZE,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [panel, setPanel] = useState(null); // { mode: "create" | "edit" | "view", employee }
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [fieldErrors, setFieldErrors] = useState(null);

  const debouncedSearch = useDebounce(search, 400);
  useEffect(() => setPage(1), [debouncedSearch]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setResult(await getEmployees({ search: debouncedSearch, page, limit: PAGE_SIZE }));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    load();
  }, [load]);

  const closePanel = () => {
    setPanel(null);
    setServerError("");
    setFieldErrors(null);
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    setServerError("");
    setFieldErrors(null);
    try {
      if (panel.mode === "create") {
        await createEmployee(values);
        toast.success("Employee created.");
      } else {
        await updateEmployee(panel.employee.id, values);
        toast.success("Employee updated.");
      }
      closePanel();
      await load();
    } catch (err) {
      setServerError(getErrorMessage(err));
      setFieldErrors(getFieldErrors(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="stack">
      <div className="page__header">
        <div>
          <h1>Employees</h1>
          <p className="page__subtitle">Manage the people who can be assigned tasks.</p>
        </div>
        <button type="button" className="button" onClick={() => setPanel({ mode: "create" })}>
          Add employee
        </button>
      </div>

      {panel && panel.mode !== "view" && (
        <section className="card">
          <div className="card__header">
            <h2>{panel.mode === "create" ? "Add employee" : `Edit ${panel.employee.name}`}</h2>
          </div>
          <div className="card__body">
            <EmployeeForm
              mode={panel.mode}
              initialValues={panel.employee}
              submitting={submitting}
              serverError={serverError}
              serverFieldErrors={fieldErrors}
              onSubmit={handleSubmit}
              onCancel={closePanel}
            />
          </div>
        </section>
      )}

      {panel?.mode === "view" && (
        <section className="card">
          <div className="card__header">
            <h2>Employee details</h2>
            <button type="button" className="button button--secondary button--sm" onClick={closePanel}>
              Close
            </button>
          </div>
          <div className="card__body">
            <div className="detail-list">
              <div className="detail-list__item">
                <span className="detail-list__label">Name</span>
                <strong>{panel.employee.name}</strong>
              </div>
              <div className="detail-list__item">
                <span className="detail-list__label">Email</span>
                <strong>{panel.employee.email}</strong>
              </div>
              <div className="detail-list__item">
                <span className="detail-list__label">Role</span>
                <strong>{panel.employee.role}</strong>
              </div>
              <div className="detail-list__item">
                <span className="detail-list__label">Email verified</span>
                <strong>{panel.employee.emailVerified ? "Yes" : "No"}</strong>
              </div>
              <div className="detail-list__item">
                <span className="detail-list__label">Created</span>
                <strong>{formatDateTime(panel.employee.createdAt)}</strong>
              </div>
              <div className="detail-list__item">
                <span className="detail-list__label">Last updated</span>
                <strong>{formatDateTime(panel.employee.updatedAt)}</strong>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="card">
        <div className="card__header">
          <div className="toolbar" style={{ flex: 1 }}>
            <SearchBar
              value={search}
              onChange={setSearch}
              onClear={() => setSearch("")}
              placeholder="Search by name or email"
            />
            {search && (
              <button type="button" className="button button--secondary button--sm" onClick={() => setSearch("")}>
                Clear
              </button>
            )}
          </div>
        </div>

        {error ? (
          <div className="card__body">
            <ErrorMessage message={error} onRetry={load} />
          </div>
        ) : loading ? (
          <LoadingSpinner label="Loading employees..." />
        ) : !result.employees.length ? (
          <EmptyState
            title={search ? "No matching employees" : "No employees yet"}
            description={
              search ? "No employee matches that search." : "Add your first employee to start assigning tasks."
            }
            action={
              search ? (
                <button type="button" className="button button--secondary" onClick={() => setSearch("")}>
                  Clear search
                </button>
              ) : (
                <button type="button" className="button" onClick={() => setPanel({ mode: "create" })}>
                  Add employee
                </button>
              )
            }
          />
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Created</th>
                    <th>Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {result.employees.map((employee) => (
                    <tr key={employee.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span className="avatar">{initials(employee.name)}</span>
                          <span className="cell-title">{employee.name}</span>
                        </div>
                      </td>
                      <td className="cell-muted">{employee.email}</td>
                      <td>
                        <span className="badge badge--neutral">{employee.role}</span>
                      </td>
                      <td className="cell-muted">{formatDate(employee.createdAt)}</td>
                      <td className="cell-muted">{formatDate(employee.updatedAt)}</td>
                      <td>
                        <div className="cell-actions">
                          <button
                            type="button"
                            className="button button--secondary button--sm"
                            onClick={() => setPanel({ mode: "view", employee })}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className="button button--secondary button--sm"
                            onClick={() =>
                              setPanel({
                                mode: "edit",
                                employee: {
                                  id: employee.id,
                                  name: employee.name,
                                  email: employee.email,
                                  role: employee.role,
                                },
                              })
                            }
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={result.currentPage}
              totalPages={result.totalPages}
              totalItems={result.totalEmployees}
              limit={result.limit}
              itemLabel="employees"
              onPageChange={setPage}
            />
          </>
        )}
      </section>
    </div>
  );
}
