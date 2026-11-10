#include "Game/MdgRulesSubsystem.h"

#include "HAL/FileManager.h"
#include "MarcaDeGranitoPC.h"
#include "Misc/FileHelper.h"
#include "Misc/Paths.h"

#include "HAL/IConsoleManager.h"
#include "HAL/PlatformTime.h"

#include "MdgAI.h"
#include "MdgBattleSetup.h"
#include "MdgDice.h"
#include "MdgFactory.h"
#include "MdgLoc.h"
#include "MdgRulesDB.h"

namespace MdgUnreal
{

std::string ToStd(const FString& S)
{
	return std::string(TCHAR_TO_UTF8(*S));
}

FString ToUnreal(const std::string& S)
{
	return FString(UTF8_TO_TCHAR(S.c_str()));
}

/** Lee los JSON con el sistema de archivos de Unreal (vale en el editor y en el juego empaquetado). */
class FUnrealDataSource : public mdg::DataSource
{
public:
	explicit FUnrealDataSource(const FString& InRoot) : Root(InRoot) {}

	virtual bool read_text(const std::string& Rel, std::string& Out) const override
	{
		const FString Path = FPaths::Combine(Root, ToUnreal(Rel));
		TArray<uint8> Bytes;
		if (!FFileHelper::LoadFileToArray(Bytes, *Path))
		{
			return false;
		}
		Out.assign(reinterpret_cast<const char*>(Bytes.GetData()), static_cast<size_t>(Bytes.Num()));
		return true;
	}

	virtual mdg::StrList list_files(const std::string& RelDir, const std::string& Ext) const override
	{
		TArray<FString> Found;
		const FString Dir = FPaths::Combine(Root, ToUnreal(RelDir));
		IFileManager::Get().FindFiles(Found, *Dir, *ToUnreal(Ext));
		Found.Sort();
		mdg::StrList Out;
		for (const FString& F : Found)
		{
			Out.push_back(ToStd(F));
		}
		return Out;
	}

private:
	FString Root;
};

bool LoadRules();
FMdgSimulationResult RunSimulation(const FString& EncounterId, int32 Seed);

FMdgCreatureSummary Summarize(const mdg::Creature& C)
{
	FMdgCreatureSummary S;
	S.Id = ToUnreal(C.id);
	S.DisplayName = ToUnreal(C.name);
	S.ClassId = ToUnreal(C.cls);
	S.SpeciesId = ToUnreal(C.species);
	S.Level = C.level;
	S.MaxHP = C.max_hp;
	S.ArmorClass = C.ac();
	S.SpeedFeet = C.speed();
	S.Size = ToUnreal(C.size);
	S.bValid = true;
	return S;
}

} // namespace MdgUnreal

void UMdgRulesSubsystem::Initialize(FSubsystemCollectionBase& Collection)
{
	Super::Initialize(Collection);
	ReloadRules();
}

FString UMdgRulesSubsystem::GetDataDirectory()
{
	return FPaths::Combine(FPaths::ProjectContentDir(), TEXT("Data"));
}

bool UMdgRulesSubsystem::ReloadRules()
{
	return MdgUnreal::LoadRules();
}

bool UMdgRulesSubsystem::AreRulesLoaded() const
{
	return mdg::RulesDB::loaded && mdg::RulesDB::errors.empty();
}

TArray<FString> UMdgRulesSubsystem::GetPartyIds() const
{
	TArray<FString> Out;
	for (const std::string& Id : mdg::jkeys(mdg::RulesDB::party))
	{
		Out.Add(MdgUnreal::ToUnreal(Id));
	}
	return Out;
}

FMdgCreatureSummary UMdgRulesSubsystem::DescribePartyMember(const FString& PartyId, int32 Level) const
{
	const std::string Id = MdgUnreal::ToStd(PartyId);
	if (!mdg::RulesDB::party.contains(Id))
	{
		return FMdgCreatureSummary();
	}
	const mdg::CreaturePtr C = mdg::Factory::make_pc(Id, Level);
	return MdgUnreal::Summarize(*C);
}

FMdgCreatureSummary UMdgRulesSubsystem::DescribeMonster(const FString& MonsterId) const
{
	const std::string Id = MdgUnreal::ToStd(MonsterId);
	if (!mdg::RulesDB::monsters.contains(Id))
	{
		return FMdgCreatureSummary();
	}
	const mdg::CreaturePtr C = mdg::Factory::make_monster(Id, 1);
	return MdgUnreal::Summarize(*C);
}

int32 UMdgRulesSubsystem::RollDice(const FString& Expression, int32 Seed) const
{
	mdg::Dice D(Seed);
	return D.roll(MdgUnreal::ToStd(Expression)).total;
}

FMdgSimulationResult UMdgRulesSubsystem::SimulateEncounter(const FString& EncounterId, int32 Seed) const
{
	return MdgUnreal::RunSimulation(EncounterId, Seed);
}

namespace MdgUnreal
{

bool LoadRules()
{
	const FString Dir = UMdgRulesSubsystem::GetDataDirectory();
	FUnrealDataSource Source(Dir);
	const bool bOk = mdg::RulesDB::load_all(Source, true);
	mdg::Loc::load(Source);
	for (const std::string& Error : mdg::RulesDB::errors)
	{
		UE_LOG(LogMarcaDeGranito, Error, TEXT("Reglas: %s"), *ToUnreal(Error));
	}
	UE_LOG(LogMarcaDeGranito, Log, TEXT("Reglas cargadas de %s: %d clases, %d conjuros, %d monstruos"), *Dir,
		static_cast<int32>(mdg::RulesDB::classes.size()), static_cast<int32>(mdg::RulesDB::spells.size()),
		static_cast<int32>(mdg::RulesDB::monsters.size()));
	return bOk;
}

FMdgSimulationResult RunSimulation(const FString& EncounterId, int32 Seed)
{
	FMdgSimulationResult Result;
	if (!mdg::RulesDB::loaded)
	{
		LoadRules();
	}
	const std::string Id = ToStd(EncounterId);
	if (!mdg::RulesDB::encounters.contains(Id))
	{
		UE_LOG(LogMarcaDeGranito, Warning, TEXT("SimulateEncounter: no existe el encuentro %s"), *EncounterId);
		return Result;
	}
	std::unique_ptr<mdg::Battle> Battle = mdg::BattleSetup::build(Id, Seed);
	mdg::AIBrain Brain(*Battle);
	Battle->start();
	int32 Guard = 0;
	double Slowest = 0.0;
	while (!Battle->over && Guard < 600)
	{
		++Guard;
		const double T0 = FPlatformTime::Seconds();
		Brain.take_turn(Battle->current);
		Slowest = FMath::Max(Slowest, (FPlatformTime::Seconds() - T0) * 1000.0);
		if (!Battle->over)
		{
			Battle->end_turn();
		}
		if (Battle->round_num > 25)
		{
			break;
		}
	}
	Result.bFinished = Battle->over;
	Result.Winner = Battle->winner;
	Result.Rounds = Battle->round_num;
	Result.SlowestTurnMs = static_cast<float>(Slowest);
	for (const std::string& Line : Battle->log_lines)
	{
		Result.Log.Add(ToUnreal(Line));
	}
	UE_LOG(LogMarcaDeGranito, Log, TEXT("Combate %s (semilla %d): %s en %d rondas, turno de IA más lento %.1f ms"), *EncounterId, Seed,
		Result.Winner == 0 ? TEXT("gana el grupo") : (Result.Winner == 1 ? TEXT("ganan los enemigos") : TEXT("sin terminar")),
		Result.Rounds, Slowest);
	return Result;
}

/** Mdg.Simulate [encuentro] [semilla]: juega el combate y vuelca el registro en el Output Log. */
void SimulateFromConsole(const TArray<FString>& Args)
{
	const FString Enc = Args.Num() > 0 ? Args[0] : FString(TEXT("e1_prado"));
	const int32 Seed = Args.Num() > 1 ? FCString::Atoi(*Args[1]) : 1000;
	const FMdgSimulationResult R = RunSimulation(Enc, Seed);
	for (const FString& Line : R.Log)
	{
		UE_LOG(LogMarcaDeGranito, Display, TEXT("  %s"), *Line);
	}
}

static FAutoConsoleCommand GMdgSimulateCommand(TEXT("Mdg.Simulate"),
	TEXT("Juega un encuentro con la IA en los dos bandos y vuelca el registro. Uso: Mdg.Simulate e1_prado 1000"),
	FConsoleCommandWithArgsDelegate::CreateStatic(&SimulateFromConsole));

} // namespace MdgUnreal
