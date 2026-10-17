import jwksRsa, { JwksClient } from 'jwks-rsa';

// Entrega la llave pública (PEM) para un kid. ms-auth la resuelve localmente; los demás, por HTTP.
export abstract class JwksKeyResolver {
  abstract getSigningKey(kid: string): Promise<string>;
}

export class HttpJwksKeyResolver extends JwksKeyResolver {
  private readonly client: JwksClient;

  constructor(jwksUri: string) {
    super();
    this.client = jwksRsa({
      jwksUri,
      cache: true,
      cacheMaxAge: 600_000,
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    });
  }

  async getSigningKey(kid: string): Promise<string> {
    const key = await this.client.getSigningKey(kid);
    return key.getPublicKey();
  }
}
