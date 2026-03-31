export type KratosWhoAmIResponse = {
  id: string;
  active: boolean;
  identity: {
    id: string;
    traits?: {
      email?: string;
      first_name?: string;
      last_name?: string;
    };
    verifiable_addresses?: Array<{
      value?: string;
      verified?: boolean;
      status?: string;
    }>;
  };
};
