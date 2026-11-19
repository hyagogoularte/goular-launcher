import { config, type TileArt } from '../config';

/** Pacotes que já estão nos blocos do Início: não se repetem em "Todos os aplicativos". */
export const HOME_PACKAGES: ReadonlySet<string> = new Set(config.homeRows.flatMap((r) => r.packages));

/** Visual de reserva do catálogo (config.appCatalog), quando houver. */
export function artFor(packageName: string): TileArt | undefined {
  return config.appCatalog[packageName]?.art;
}

/** Nome do catálogo; sem entrada, o nome que o app instalado informa ou o pacote. */
export function labelFor(packageName: string, installedLabel?: string): string {
  return config.appCatalog[packageName]?.label ?? installedLabel ?? packageName;
}
