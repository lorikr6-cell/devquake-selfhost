// The product form's values, shared by the page (server) and the form (client).

export interface OptionValue {
  id: number | null;
  name: string;
  sku: string;
  price: string;
  sale: string;
  /** datetime-local values in the owner's time zone. */
  saleFrom: string;
  saleUntil: string;
  stock: string;
}

export interface ProductValue {
  id: number | null;
  name: string;
  slug: string;
  summary: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  gtin: string;
  category: string;
  /** '' for none. */
  typeId: string;
  vendorId: string;
  /** Field id → value (multiselect: one per line; yes/no: "1" or "0"). */
  values: Record<number, string>;
  vatRate: string;
  published: boolean;
  options: OptionValue[];
}

export const emptyOption = (): OptionValue => ({
  id: null,
  name: '',
  sku: '',
  price: '',
  sale: '',
  saleFrom: '',
  saleUntil: '',
  stock: '',
});

export const emptyProduct = (): ProductValue => ({
  id: null,
  name: '',
  slug: '',
  summary: '',
  description: '',
  seoTitle: '',
  seoDescription: '',
  gtin: '',
  category: '',
  typeId: '',
  vendorId: '',
  values: {},
  vatRate: '',
  published: true,
  options: [emptyOption()],
});
