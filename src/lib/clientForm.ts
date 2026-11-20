export type ClientFormValues = {
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
};

export type ClientFormErrors = Partial<Record<keyof ClientFormValues, string>>;

export type ClientFormState = {
  status: "idle" | "error" | "success";
  message?: string;
  values?: ClientFormValues;
  fieldErrors?: ClientFormErrors;
};

export const CLIENT_FIELD_LIMITS = {
  name: 200,
  email: 254,
  phone: 60,
  address: 1000,
  notes: 10000,
} as const;

export function validateClientForm(formData: FormData) {
  const read = (field: keyof ClientFormValues) => {
    const value = formData.get(field);
    return typeof value === "string" ? value.trim() : "";
  };
  const values: ClientFormValues = {
    name: read("name"),
    email: read("email"),
    phone: read("phone"),
    address: read("address"),
    notes: read("notes"),
  };
  const fieldErrors: ClientFormErrors = {};

  if (!values.name) fieldErrors.name = "Renseignez le nom du client.";
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    fieldErrors.email = "Saisissez une adresse email valide.";
  }
  for (const field of Object.keys(CLIENT_FIELD_LIMITS) as Array<
    keyof ClientFormValues
  >) {
    if (values[field].length > CLIENT_FIELD_LIMITS[field]) {
      fieldErrors[field] =
        `Limitez ce champ à ${CLIENT_FIELD_LIMITS[field]} caractères.`;
    }
  }

  return { values, fieldErrors };
}
