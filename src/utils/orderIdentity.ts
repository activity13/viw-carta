export interface OrderIdentity {
  shortId: string;
}

export const generateOrderIdentity = (): OrderIdentity => {
  const shortId = Math.floor(1000 + Math.random() * 9000).toString(); // 4 digit ID

  return {
    shortId,
  };
};
