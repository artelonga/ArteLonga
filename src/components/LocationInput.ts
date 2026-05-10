import { esc } from "../lib/esc";

export interface LocationInputProps {
    estado: string;
    cidade: string;
    bairro: string;
}

export function LocationInput(props: LocationInputProps): string {
    const { estado, cidade, bairro } = props;
    return `<div class="market-loc">
        <span class="market-loc-field" id="loc-estado-wrap">
            <input type="text" id="loc-estado" class="market-loc-input is-default"
                   value="${esc(estado)}" autocomplete="off" spellcheck="false"
                   placeholder="Estado" aria-label="Estado"
                   aria-autocomplete="list" aria-controls="dd-estado" data-field="estado">
            <ul class="loc-dropdown" id="dd-estado" hidden role="listbox"></ul>
        </span>
        <span class="market-loc-field">
            <input type="text" id="loc-cidade" class="market-loc-input is-default"
                   value="${esc(cidade)}" autocomplete="off" spellcheck="false"
                   placeholder="Cidade" aria-label="Cidade"
                   aria-autocomplete="list" aria-controls="dd-cidade" data-field="cidade">
            <ul class="loc-dropdown" id="dd-cidade" hidden role="listbox"></ul>
        </span>
        <span class="market-loc-field">
            <input type="text" id="loc-bairro" class="market-loc-input is-default"
                   value="${esc(bairro)}" autocomplete="off" spellcheck="false"
                   placeholder="Bairro" aria-label="Bairro"
                   aria-autocomplete="list" aria-controls="dd-bairro" data-field="bairro">
            <ul class="loc-dropdown" id="dd-bairro" hidden role="listbox"></ul>
        </span>
    </div>
    <p class="market-loc-help">Clique pra editar.</p>`;
}
