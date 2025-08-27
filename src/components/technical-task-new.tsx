"use client";

import React, { useState } from "react";
import type { ChangeEvent } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface FormData {
  unidade: string;
  empresa: string;
  setorResponsavel: string;
  usuarioResponsavel?: string;
  finalidade: string;
  prazo: string;
  prioridade: string;
  arquivos?: File[];
  observacoes: string;
}

interface SelectOption {
  value: string;
  label: string;
}

const mockUnidades: SelectOption[] = [
  { value: "unidade1", label: "Unidade 1" },
  { value: "unidade2", label: "Unidade 2" },
];

const mockEmpresas: { [key: string]: SelectOption[] } = {
  unidade1: [
    { value: "empresa1", label: "Empresa 1 - Unidade 1" },
    { value: "empresa2", label: "Empresa 2 - Unidade 1" },
  ],
  unidade2: [
    { value: "empresa3", label: "Empresa 3 - Unidade 2" },
    { value: "empresa4", label: "Empresa 4 - Unidade 2" },
  ],
};

const mockSetores: SelectOption[] = [
  { value: "setor1", label: "Setor 1" },
  { value: "setor2", label: "Setor 2" },
];

const mockUsuarios: SelectOption[] = [
  { value: "user1", label: "Usuário 1" },
  { value: "user2", label: "Usuário 2" },
];

const mockFinalidades: SelectOption[] = [
  { value: "finalidade1", label: "Finalidade 1" },
  { value: "finalidade2", label: "Finalidade 2" },
];

const mockPrioridades: SelectOption[] = [
  { value: "alta", label: "Alta" },
  { value: "media", label: "Média" },
  { value: "baixa", label: "Baixa" },
];

export const NewTaskForm: React.FC = () => {
  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState<FormData>({
    unidade: "",
    empresa: "",
    setorResponsavel: "",
    usuarioResponsavel: "",
    finalidade: "",
    prazo: "",
    prioridade: "",
    observacoes: "",
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleNext = () => {
    // Pode adicionar validação antes de avançar para a próxima step
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === "unidade") {
      setFormData((prev) => ({ ...prev, unidade: value, empresa: "" }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = () => {
    console.log("Dados do formulário:", formData, selectedFiles);
  };

  return (
    <div className="w-full">
      <SiteHeader title='Criar Nova Tarefa' />
      <div className="p-6 max-w-4xl mx-auto mt-4 bg-card rounded-lg shadow">
        {step === 1 && (
          <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col items-end">
              <div>
                <Label htmlFor="unidade" className="mb-2 text-left">Unidade</Label>
                <Select value={formData.unidade} onValueChange={(value) => handleSelectChange("unidade", value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione uma unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockUnidades.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col items-start">
              <div>
                <Label htmlFor="empresa" className="mb-2">Empresa</Label>
                <Select
                  value={formData.empresa}
                  onValueChange={(value) => handleSelectChange("empresa", value)}
                  disabled={!formData.unidade}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={formData.unidade ? "Selecione uma empresa" : "Selecione a unidade primeiro"} />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.unidade && mockEmpresas[formData.unidade]?.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="setorResponsavel" className="mb-2">Setor</Label>
              <Select value={formData.setorResponsavel}
                onValueChange={(value) => handleSelectChange("setorResponsavel", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um setor" />
                </SelectTrigger>
                <SelectContent>
                  {mockSetores.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="usuarioResponsavel" className="mb-2">Responsável (opcional)</Label>
              <Select value={formData.usuarioResponsavel}
                onValueChange={(value) => handleSelectChange("usuarioResponsavel", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent>
                  {mockUsuarios.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full">
              <Label htmlFor="finalidade" className="mb-2">Finalidade</Label>
              <Select value={formData.finalidade}
                onValueChange={(value) => handleSelectChange("finalidade", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a finalidade" />
                </SelectTrigger>
                <SelectContent>
                  {mockFinalidades.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="prazo" className="mb-2">Prazo</Label>
              <Input
                type="date"
                name="prazo"
                value={formData.prazo}
                onChange={handleChange}
                className="w-auto"
              />
            </div>
            <div>
              <Label htmlFor="prioridade" className="mb-2">Prioridade</Label>
              <Select value={formData.prioridade}
                onValueChange={(value) => handleSelectChange("prioridade", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a prioridade" />
                </SelectTrigger>
                <SelectContent>
                  {mockPrioridades.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="arquivos" className="mb-2">Upload de Arquivos</Label>
              <Input
                type="file"
                name="arquivos"
                multiple
                onChange={handleFileChange}
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="observacoes" className="mb-2">Observações</Label>
              <Textarea
                name="observacoes"
                placeholder="Digite suas observações..."
                value={formData.observacoes}
                onChange={handleChange}
                className="w-full"
              />
            </div>
          </div>
        )}

        <div className="flex justify-between mt-6">
          {step > 1 && (
            <Button className="cursor-pointer" variant="outline" onClick={handleBack}>
              Voltar
            </Button>
          )}
          {step < 3 ? (
            <Button className="button-primary" onClick={handleNext}>Próximo</Button>
          ) : (
            <Button className="button-success" onClick={handleSubmit}>Enviar</Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewTaskForm;