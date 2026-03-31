export type AuthFlowType =
  | 'login'
  | 'registration'
  | 'verification'
  | 'recovery';

export type KratosUiNode = {
  type: string;
  group: string;
  messages?: Array<{
    id: number;
    text: string;
    type: 'error' | 'info' | 'success';
  }>;
  meta: {
    label?: {
      id: number;
      text: string;
      type: 'info';
    };
  };
  attributes: {
    node_type: 'input';
    type: string;
    name: string;
    value?: unknown;
    required?: boolean;
    disabled?: boolean;
  };
};

export type KratosFlow = {
  id: string;
  type: string;
  issued_at: string;
  expires_at: string;
  ui: {
    action: string;
    method: 'POST' | 'GET';
    messages?: Array<{
      id: number;
      text: string;
      type: 'error' | 'info' | 'success';
    }>;
    nodes: KratosUiNode[];
  };
};
