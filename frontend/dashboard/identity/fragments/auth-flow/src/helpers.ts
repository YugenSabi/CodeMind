import type { AuthFlowType, KratosUiNode } from '@lib/auth';

export function getHiddenNodes(nodes: KratosUiNode[]) {
  return nodes.filter(
    (node) =>
      node.attributes.node_type === 'input' && node.attributes.type === 'hidden',
  );
}

export function orderRegistrationNodes(nodes: KratosUiNode[]) {
  const order = [
    'traits.email',
    'password',
    'traits.first_name',
    'traits.last_name',
  ];

  return [...nodes].sort((left, right) => {
    const leftIndex = order.indexOf(left.attributes.name);
    const rightIndex = order.indexOf(right.attributes.name);
    const normalizedLeftIndex = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex;
    const normalizedRightIndex =
      rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex;

    return normalizedLeftIndex - normalizedRightIndex;
  });
}

export function toStringValue(value: unknown) {
  return typeof value === 'string' ? value : '';
}

export function humanizeName(name: string) {
  switch (name) {
    case 'traits.email':
    case 'identifier':
      return 'Электронная почта';
    case 'password':
      return 'Пароль';
    case 'traits.first_name':
      return 'Имя';
    case 'traits.last_name':
      return 'Фамилия';
    case 'code':
      return 'Код подтверждения';
    default:
      return name;
  }
}

export function resolveAutoComplete(
  name: string,
  type: string,
  flowType: AuthFlowType,
) {
  if (name === 'traits.email' || name === 'identifier') return 'email';
  if (name === 'traits.first_name') return 'given-name';
  if (name === 'traits.last_name') return 'family-name';
  if (name === 'password' && type === 'password') {
    return flowType === 'registration' ? 'new-password' : 'current-password';
  }
  if (name === 'code') return 'one-time-code';
  return undefined;
}
