using UnrealBuildTool;

public class MarcaDeGranitoPCTarget : TargetRules
{
	public MarcaDeGranitoPCTarget(TargetInfo Target) : base(Target)
	{
		Type = TargetType.Game;
		DefaultBuildSettings = BuildSettingsVersion.Latest;
		IncludeOrderVersion = EngineIncludeOrderVersion.Latest;
		ExtraModuleNames.Add("MarcaDeGranitoPC");
	}
}
