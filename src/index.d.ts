declare global {
  interface User {
    accessToken: string;
    refreshToken: string;
  }
}

export {};