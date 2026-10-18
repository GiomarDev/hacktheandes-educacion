import { Injectable } from '@nestjs/common';
import { JwksKeyResolver } from '@app/common';
import { KeysService } from './keys.service.js';

// ms-auth verifica sus propios tokens sin llamarse por HTTP.
@Injectable()
export class LocalJwksKeyResolver extends JwksKeyResolver {
  constructor(private readonly keys: KeysService) {
    super();
  }

  async getSigningKey(kid: string): Promise<string> {
    const pem = await this.keys.getPublicKeyPem(kid);
    if (!pem) throw new Error(`kid desconocido: ${kid}`);
    return pem;
  }
}
