export type HcmEmployee = {
  id: string;
  displayName: string;
  email: string;
  departmentId: string;
  managerId: string | null;
};

/**
 * IDs align with packages/database prisma seed (A, B @ CURITIBA_HQ; C @ US_OFFICE)
 * so outbox / HCM flows can resolve employees by id.
 */
export const MOCK_EMPLOYEES: HcmEmployee[] = [
  {
    id: "A",
    displayName: "Employee A (Curitiba HQ)",
    email: "employee.a@example.com",
    departmentId: "dept_eng",
    managerId: null,
  },
  {
    id: "B",
    displayName: "Employee B (Curitiba HQ)",
    email: "employee.b@example.com",
    departmentId: "dept_eng",
    managerId: "A",
  },
  {
    id: "C",
    displayName: "Employee C (US Office)",
    email: "employee.c@example.com",
    departmentId: "dept_hr",
    managerId: "A",
  },
];
