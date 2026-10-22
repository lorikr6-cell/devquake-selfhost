import { describe, expect, it } from 'vitest';
import { cnpChecksum } from './cnp';
import { readIdCard } from './id-card';

const cnp = (first12: string) => first12 + cnpChecksum(first12);
const CNP = cnp('257091712345'); // a woman born on 17 September 1957

// What OCR typically returns for an older Romanian identity card (with its usual mistakes).
const CARD = `ROMANIA
CARTE DE IDENTITATE
SERIA XV NR 123456
CNP ${CNP.slice(0, 7)} ${CNP.slice(7)}
Nume/Nom/Last name
POPESCU
Prenume/Prenom/First name
MARIA ELENA
Domiciliu/Adresse/Address
Mun. Cluj-Napoca, Str. Lalelelor nr. 12
ap. 4
Emisă de/Delivree par/Issued by
SPCLEP Cluj-Napoca
IDROUPOPESCU<<MARIA<ELENA<<<<<<<<<<<
XV12345G<4ROU5709170F2805179${CNP.slice(7, 13)}<<<1`;

describe('reading an identity card', () => {
  it('reads every field of a card', () => {
    expect(readIdCard(CARD)).toEqual({
      lastName: 'Popescu',
      firstName: 'Maria Elena',
      cnp: CNP,
      birthDate: '1957-09-17',
      idSeries: 'XV',
      idNumber: '123456',
      address: 'Mun. Cluj-Napoca, Str. Lalelelor nr. 12, ap. 4',
      idExpiresOn: '2028-05-17',
    });
  });

  it('fixes letters read instead of digits, and checks the CNP', () => {
    const misread = CNP.replace(/0/g, 'O');
    expect(readIdCard(`CNP ${misread}`).cnp).toBe(CNP);
    const wrong = CNP.slice(0, 12) + ((Number(CNP[12]) + 1) % 10);
    expect(readIdCard(`CNP ${wrong}`).cnp).toBeNull();
  });

  it('leaves out what it cannot read', () => {
    expect(readIdCard('a blurry picture')).toEqual({
      lastName: null,
      firstName: null,
      cnp: null,
      birthDate: null,
      idSeries: null,
      idNumber: null,
      address: null,
      idExpiresOn: null,
    });
  });

  it('reads the expiry from the front when the machine zone is unreadable', () => {
    expect(readIdCard('Valabilitate 12.03.18-17.09.2028').idExpiresOn).toBe('2028-09-17');
  });

  it('takes the series from the front when the machine zone is unreadable', () => {
    expect(readIdCard('SERIA KX NR 9O1234').idNumber).toBe('901234');
  });
});
