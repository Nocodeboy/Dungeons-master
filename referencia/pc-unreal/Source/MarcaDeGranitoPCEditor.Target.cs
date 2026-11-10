using UnrealBuildTool;

public class MarcaDeGranitoPCEditorTarget : TargetRules
{
	public MarcaDeGranitoPCEditorTarget(TargetInfo Target) : base(Target)
	{
		Type = TargetType.Editor;
		DefaultBuildSettings = BuildSettingsVersion.Latest;
		IncludeOrderVersion = EngineIncludeOrderVersion.Latest;
		ExtraModuleNames.Add("MarcaDeGranitoPC");
	}
}
