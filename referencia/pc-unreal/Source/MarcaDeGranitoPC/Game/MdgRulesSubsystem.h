// Marca de Granito PC · puente entre Unreal y el núcleo de reglas portable (namespace mdg).
// Carga Content/Data/*.json al arrancar el juego y ofrece consultas a Blueprints y C++.
#pragma once

#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"

#include "MdgRulesSubsystem.generated.h"

/** Resumen de una criatura para la interfaz (hoja rápida). */
USTRUCT(BlueprintType)
struct MARCADEGRANITOPC_API FMdgCreatureSummary
{
	GENERATED_BODY()

	UPROPERTY(BlueprintReadOnly, Category = "Marca de Granito")
	FString Id;

	UPROPERTY(BlueprintReadOnly, Category = "Marca de Granito")
	FString DisplayName;

	UPROPERTY(BlueprintReadOnly, Category = "Marca de Granito")
	FString ClassId;

	UPROPERTY(BlueprintReadOnly, Category = "Marca de Granito")
	FString SpeciesId;

	UPROPERTY(BlueprintReadOnly, Category = "Marca de Granito")
	int32 Level = 1;

	UPROPERTY(BlueprintReadOnly, Category = "Marca de Granito")
	int32 MaxHP = 0;

	UPROPERTY(BlueprintReadOnly, Category = "Marca de Granito")
	int32 ArmorClass = 0;

	UPROPERTY(BlueprintReadOnly, Category = "Marca de Granito")
	int32 SpeedFeet = 0;

	UPROPERTY(BlueprintReadOnly, Category = "Marca de Granito")
	FString Size;

	UPROPERTY(BlueprintReadOnly, Category = "Marca de Granito")
	bool bValid = false;
};

/** Resultado de un combate jugado entero por la IA en ambos bandos (prueba del núcleo de combate). */
USTRUCT(BlueprintType)
struct MARCADEGRANITOPC_API FMdgSimulationResult
{
	GENERATED_BODY()

	/** El combate terminó (un bando quedó fuera de combate) antes del límite de rondas. */
	UPROPERTY(BlueprintReadOnly, Category = "Marca de Granito")
	bool bFinished = false;

	/** 0 = gana el grupo, 1 = ganan los enemigos, -1 = sin terminar. */
	UPROPERTY(BlueprintReadOnly, Category = "Marca de Granito")
	int32 Winner = -1;

	UPROPERTY(BlueprintReadOnly, Category = "Marca de Granito")
	int32 Rounds = 0;

	/** Registro de combate en español, línea a línea. */
	UPROPERTY(BlueprintReadOnly, Category = "Marca de Granito")
	TArray<FString> Log;

	/** Milisegundos del turno de IA más lento. */
	UPROPERTY(BlueprintReadOnly, Category = "Marca de Granito")
	float SlowestTurnMs = 0.0f;
};

UCLASS()
class MARCADEGRANITOPC_API UMdgRulesSubsystem : public UGameInstanceSubsystem
{
	GENERATED_BODY()

public:
	virtual void Initialize(FSubsystemCollectionBase& Collection) override;

	/** Vuelve a leer los JSON de Content/Data. Devuelve false si hubo errores (salen en el registro). */
	UFUNCTION(BlueprintCallable, Category = "Marca de Granito|Reglas")
	bool ReloadRules();

	UFUNCTION(BlueprintPure, Category = "Marca de Granito|Reglas")
	bool AreRulesLoaded() const;

	/** Compañeros escritos (party.json). */
	UFUNCTION(BlueprintCallable, Category = "Marca de Granito|Reglas")
	TArray<FString> GetPartyIds() const;

	UFUNCTION(BlueprintCallable, Category = "Marca de Granito|Reglas")
	FMdgCreatureSummary DescribePartyMember(const FString& PartyId, int32 Level) const;

	UFUNCTION(BlueprintCallable, Category = "Marca de Granito|Reglas")
	FMdgCreatureSummary DescribeMonster(const FString& MonsterId) const;

	/** Tira una expresión de dados ("2d6+3"). Semilla negativa = al azar. */
	UFUNCTION(BlueprintCallable, Category = "Marca de Granito|Reglas")
	int32 RollDice(const FString& Expression, int32 Seed = -1) const;

	/**
	 * Juega un encuentro de Content/Data/encounters entero con la IA en los dos bandos y el grupo por
	 * defecto. Misma semilla = mismo combate, idéntico al de la versión de Godot.
	 */
	UFUNCTION(BlueprintCallable, Category = "Marca de Granito|Reglas")
	FMdgSimulationResult SimulateEncounter(const FString& EncounterId, int32 Seed = 1000) const;

	/** Carpeta de los JSON de reglas. */
	static FString GetDataDirectory();
};
